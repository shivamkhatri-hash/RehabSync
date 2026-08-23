import time

from geometry import calculate_angle, ema

from .base import BaseAnalyzer, clamp, distance


class MiniSquatAnalyzer(BaseAnalyzer):
    def measure(self, landmarks, side, landmark_set):
        left = calculate_angle(landmarks[23], landmarks[25], landmarks[27])
        right = calculate_angle(landmarks[24], landmarks[26], landmarks[28])
        return (left + right) / 2.0

    def form_check(self, landmarks, side, landmark_set, metric):
        shoulder_mid_x = (landmarks[11].x + landmarks[12].x) / 2.0
        hip_mid_x = (landmarks[23].x + landmarks[24].x) / 2.0
        lean = abs(shoulder_mid_x - hip_mid_x)
        ok = lean <= 0.18
        feedback = self.config.good_feedback if ok else "Keep your trunk steadier during the mini squat."
        return ok, feedback, [f"torso_lean={lean:.3f}"]


class SitToStandAnalyzer(MiniSquatAnalyzer):
    def form_check(self, landmarks, side, landmark_set, metric):
        left = calculate_angle(landmarks[23], landmarks[25], landmarks[27])
        right = calculate_angle(landmarks[24], landmarks[26], landmarks[28])
        symmetry = abs(left - right)
        ok = symmetry <= 25
        feedback = self.config.good_feedback if ok else "Try to load both legs evenly while standing."
        return ok, feedback, [f"knee_symmetry_difference={symmetry:.1f}"]


class WallSlideAnalyzer(BaseAnalyzer):
    def measure(self, landmarks, side, landmark_set):
        left = calculate_angle(landmarks[23], landmarks[11], landmarks[13])
        right = calculate_angle(landmarks[24], landmarks[12], landmarks[14])
        return (left + right) / 2.0

    def form_check(self, landmarks, side, landmark_set, metric):
        left = calculate_angle(landmarks[23], landmarks[11], landmarks[13])
        right = calculate_angle(landmarks[24], landmarks[12], landmarks[14])
        difference = abs(left - right)
        ok = difference <= self.config.secondary_threshold
        feedback = self.config.good_feedback if ok else "Move both arms at the same height."
        return ok, feedback, [f"arm_symmetry_difference={difference:.1f}"]


class MarchingAnalyzer(BaseAnalyzer):
    def reset(self):
        super().reset()
        self.side_phases = {"left": "rest", "right": "rest"}
        self.side_counts = {"left": 0, "right": 0}
        self.last_counted_side = None
        self.started_at = None
        self.cadence = 0.0

    def measure(self, landmarks, side, landmark_set):
        left = calculate_angle(landmarks[11], landmarks[23], landmarks[25])
        right = calculate_angle(landmarks[12], landmarks[24], landmarks[26])
        return min(left, right)

    def process(self, landmarks, side, landmark_set, confidence, timestamp_s=None):
        timestamp_s = time.monotonic() if timestamp_s is None else timestamp_s
        if self.session_started_at is None:
            self.session_started_at = timestamp_s
        self.last_timestamp = timestamp_s
        left = calculate_angle(landmarks[11], landmarks[23], landmarks[25])
        right = calculate_angle(landmarks[12], landmarks[24], landmarks[26])
        active = "left" if left < right else "right"
        active_angle = left if active == "left" else right

        raw = active_angle
        value = ema(self.smoothed_metric, raw, self.smoothing_alpha)
        self.raw_metric = raw
        self.smoothed_metric = value
        self.min_metric = value if self.min_metric is None else min(self.min_metric, value)
        self.max_metric = value if self.max_metric is None else max(self.max_metric, value)
        normalized = self.normalized_rom(value)

        angles = {"left": left, "right": right}
        for candidate in ("left", "right"):
            candidate_normalized = self.normalized_rom(angles[candidate])
            other = "right" if candidate == "left" else "left"

            if (
                self.side_phases[candidate] == "rest"
                and candidate_normalized >= 0.90
                and angles[other] >= 145
            ):
                self.side_counts[candidate] += 1
                self.side_phases[candidate] = "lifted"

            elif (
                self.side_phases[candidate] == "lifted"
                and candidate_normalized <= 0.25
            ):
                if candidate != self.last_counted_side:
                    self.reps += 1
                    self.last_counted_side = candidate
                    self.started_at = timestamp_s if self.started_at is None else self.started_at
                self.side_phases[candidate] = "rest"

        if self.started_at is not None and timestamp_s > self.started_at:
            self.cadence = self.reps * 60.0 / (timestamp_s - self.started_at)

        self.phase = f"{active}_lift" if normalized >= 0.5 else "rest"
        self.constraints = [f"left_hip_angle={left:.1f}", f"right_hip_angle={right:.1f}", f"cadence={self.cadence:.1f}"]
        result = self.result(active, confidence, normalized, True, self.config.good_feedback, value)
        result["cadence"] = round(self.cadence, 1)
        return result


class BalanceAnalyzer(BaseAnalyzer):
    def reset(self):
        super().reset()
        self.hold_started_at = None
        self.loss_frames = 0
        self.sway_origin = None

    def measure(self, landmarks, side, landmark_set):
        leg_length = (distance(landmarks[23], landmarks[25]) + distance(landmarks[25], landmarks[27]) + distance(landmarks[24], landmarks[26]) + distance(landmarks[26], landmarks[28])) / 2.0
        if leg_length < 1e-6:
            return 0.0
        return abs(landmarks[27].y - landmarks[28].y) / leg_length

    def process(self, landmarks, side, landmark_set, confidence, timestamp_s=None):
        timestamp_s = time.monotonic() if timestamp_s is None else timestamp_s
        if self.session_started_at is None:
            self.session_started_at = timestamp_s
        self.last_timestamp = timestamp_s
        raw = self.measure(landmarks, side, landmark_set)
        value = ema(self.smoothed_metric, raw, self.smoothing_alpha)
        self.raw_metric = raw
        self.smoothed_metric = value
        self.min_metric = value if self.min_metric is None else min(self.min_metric, value)
        self.max_metric = value if self.max_metric is None else max(self.max_metric, value)
        normalized = self.normalized_rom(value)
        active = "left" if landmarks[27].y < landmarks[28].y else "right"
        hip_mid_x = (landmarks[23].x + landmarks[24].x) / 2.0

        if normalized >= 0.85:
            self.loss_frames = 0
            if self.hold_started_at is None:
                self.hold_started_at = timestamp_s
                self.sway_origin = hip_mid_x
            self.hold_seconds = timestamp_s - self.hold_started_at
            self.phase = "holding"
        else:
            self.loss_frames += 1
            if self.loss_frames > self.config.lost_grace_frames:
                self.hold_started_at = None
                self.hold_seconds = 0.0
                self.sway_origin = None
                self.phase = "ready"

        sway = 0.0 if self.sway_origin is None else abs(hip_mid_x - self.sway_origin)
        form_ok = self.phase == "holding" and sway <= 0.08
        feedback = "Balance hold active." if form_ok else self.config.bad_feedback
        self.constraints = [f"hip_sway={sway:.3f}", f"foot_clearance={value:.3f}"]
        self.reps = 0
        return self.result(active, confidence, normalized, form_ok, feedback, None)


class BirdDogAnalyzer(BaseAnalyzer):
    def reset(self):
        super().reset()
        self.hold_started_at = None

    def _diagonal_scores(self, landmarks):
        torso_left = max(distance(landmarks[11], landmarks[23]), 1e-6)
        torso_right = max(distance(landmarks[12], landmarks[24]), 1e-6)
        left_arm = distance(landmarks[11], landmarks[15]) / torso_left
        right_arm = distance(landmarks[12], landmarks[16]) / torso_right
        left_leg = distance(landmarks[23], landmarks[27]) / torso_left
        right_leg = distance(landmarks[24], landmarks[28]) / torso_right
        return (left_arm + right_leg) / 2.0, (right_arm + left_leg) / 2.0

    def measure(self, landmarks, side, landmark_set):
        return max(self._diagonal_scores(landmarks))

    def process(self, landmarks, side, landmark_set, confidence, timestamp_s=None):
        timestamp_s = time.monotonic() if timestamp_s is None else timestamp_s
        if self.session_started_at is None:
            self.session_started_at = timestamp_s
        self.last_timestamp = timestamp_s
        left_right, right_left = self._diagonal_scores(landmarks)
        active = "left_arm_right_leg" if left_right >= right_left else "right_arm_left_leg"
        raw = max(left_right, right_left)
        value = ema(self.smoothed_metric, raw, self.smoothing_alpha)
        self.raw_metric = raw
        self.smoothed_metric = value
        self.min_metric = value if self.min_metric is None else min(self.min_metric, value)
        self.max_metric = value if self.max_metric is None else max(self.max_metric, value)
        normalized = self.normalized_rom(value)
        self.update_reps(value, normalized, timestamp_s)

        if normalized >= 0.90:
            if self.hold_started_at is None:
                self.hold_started_at = timestamp_s
            self.hold_seconds = timestamp_s - self.hold_started_at
        else:
            self.hold_started_at = None
            self.hold_seconds = 0.0

        hip_difference = abs(landmarks[23].y - landmarks[24].y)
        form_ok = hip_difference <= 0.12
        feedback = self.config.good_feedback if form_ok and normalized >= 0.75 else self.config.bad_feedback
        self.constraints = [f"diagonal={active}", f"hip_tilt={hip_difference:.3f}"]
        return self.result(active, confidence, normalized, form_ok, feedback, None)
