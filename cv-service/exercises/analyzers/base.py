import time

from geometry import ema


def clamp(value, low=0.0, high=1.0):
    return max(low, min(high, value))


def distance(a, b):
    return ((a.x - b.x) ** 2 + (a.y - b.y) ** 2) ** 0.5


class BaseAnalyzer:
    """Shared smoothing, ROM, rep hysteresis, telemetry, and scoring."""

    def __init__(self, config, smoothing_alpha=0.30):
        self.config = config
        self.smoothing_alpha = smoothing_alpha
        self.reset()

    def reset(self):
        self.reps = 0
        self.phase = "rest"
        self.raw_metric = None
        self.smoothed_metric = None
        self.min_metric = None
        self.max_metric = None
        self.hold_seconds = 0.0
        self.last_rep_time = -1000.0
        self.transition_target = None
        self.transition_count = 0
        self.cycle_min = None
        self.cycle_max = None
        self.constraints = []
        self.session_started_at = None
        self.last_timestamp = None

    def measure(self, landmarks, side, landmark_set):
        raise NotImplementedError

    def form_check(self, landmarks, side, landmark_set, metric):
        return True, self.config.good_feedback, []

    def normalized_rom(self, value):
        span = self.config.target_value - self.config.rest_value
        if abs(span) < 1e-9:
            return 0.0
        return clamp((value - self.config.rest_value) / span)

    def _held(self, target):
        if self.transition_target != target:
            self.transition_target = target
            self.transition_count = 1
        else:
            self.transition_count += 1
        if self.transition_count < self.config.transition_frames:
            return False
        self.transition_target = None
        self.transition_count = 0
        return True

    def _clear_transition(self):
        self.transition_target = None
        self.transition_count = 0

    def update_reps(self, value, normalized, timestamp_s):
        self.cycle_min = value if self.cycle_min is None else min(self.cycle_min, value)
        self.cycle_max = value if self.cycle_max is None else max(self.cycle_max, value)

        if self.phase == "rest" and normalized >= 0.90:
            if self._held("target"):
                self.phase = "target"
            return

        if self.phase == "target" and normalized <= 0.20:
            if not self._held("rest"):
                return
            maximum = value if self.cycle_max is None else self.cycle_max
            minimum = value if self.cycle_min is None else self.cycle_min
            excursion = maximum - minimum
            if (
                excursion >= self.config.min_rep_range
                and timestamp_s - self.last_rep_time >= self.config.rep_cooldown
            ):
                self.reps += 1
                self.last_rep_time = timestamp_s
            self.phase = "rest"
            self.cycle_min = value
            self.cycle_max = value
            return

        self._clear_transition()

    def _score(self, confidence, normalized, form_ok):
        confidence_points = clamp(confidence) * 55.0
        rom_points = clamp(normalized) * 30.0
        constraint_points = 15.0 if form_ok else 4.0
        return int(round(clamp(confidence_points + rom_points + constraint_points, 0, 100)))

    def process(self, landmarks, side, landmark_set, confidence, timestamp_s=None):
        timestamp_s = time.monotonic() if timestamp_s is None else timestamp_s
        if self.session_started_at is None:
            self.session_started_at = timestamp_s
        self.last_timestamp = timestamp_s
        raw = float(self.measure(landmarks, side, landmark_set))
        value = ema(self.smoothed_metric, raw, self.smoothing_alpha)
        self.raw_metric = raw
        self.smoothed_metric = value
        self.min_metric = value if self.min_metric is None else min(self.min_metric, value)
        self.max_metric = value if self.max_metric is None else max(self.max_metric, value)

        normalized = self.normalized_rom(value)
        form_ok, feedback, constraints = self.form_check(
            landmarks, side, landmark_set, value
        )
        self.constraints = constraints
        self.update_reps(value, normalized, timestamp_s)

        return self.result(
            side=side,
            confidence=confidence,
            normalized=normalized,
            form_ok=form_ok,
            feedback=feedback,
            angle=value,
        )

    def result(self, side, confidence, normalized, form_ok, feedback, angle=None):
        return {
            "exercise": self.config.name,
            "pose_detected": True,
            "side": side,
            "reps": self.reps,
            "phase": self.phase,
            "angle": None if angle is None else round(angle, 1),
            "value": None if self.smoothed_metric is None else round(self.smoothed_metric, 3),
            "raw_metric": None if self.raw_metric is None else round(self.raw_metric, 3),
            "smoothed_metric": None if self.smoothed_metric is None else round(self.smoothed_metric, 3),
            "normalized_rom": round(clamp(normalized), 3),
            "form_ok": bool(form_ok),
            "form_score": self._score(confidence, normalized, form_ok),
            "confidence": round(confidence, 3),
            "feedback": feedback,
            "min_angle": None if self.min_metric is None else round(self.min_metric, 1),
            "max_angle": None if self.max_metric is None else round(self.max_metric, 1),
            "min_value": None if self.min_metric is None else round(self.min_metric, 3),
            "max_value": None if self.max_metric is None else round(self.max_metric, 3),
            "hold_seconds": round(self.hold_seconds, 2),
            "duration_seconds": round(
                0.0 if self.session_started_at is None or self.last_timestamp is None
                else max(0.0, self.last_timestamp - self.session_started_at),
                2,
            ),
            "active_constraints": list(self.constraints),
        }

    def tracking_lost(self):
        self.phase = "rest"
        self.transition_target = None
        self.transition_count = 0
        self.cycle_min = None
        self.cycle_max = None
        self.smoothed_metric = None
