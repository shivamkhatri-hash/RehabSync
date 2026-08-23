from pathlib import Path
from dataclasses import dataclass
from collections import deque
import math
import time

import cv2
import mediapipe as mp
import numpy as np

from geometry import (
    calculate_angle,
    ema,
)
from exercises.analyzers import create_analyzer


LEFT_IDS = {
    11, 13, 15,
    23, 25, 27,
    29, 31,
}

RIGHT_IDS = {
    12, 14, 16,
    24, 26, 28,
    30, 32,
}


@dataclass
class StableLandmark:
    x: float
    y: float
    z: float
    visibility: float
    presence: float


def distance(a, b):

    return math.hypot(
        a.x - b.x,
        a.y - b.y,
    )


class PoseEngine:

    def __init__(
        self,
        model_path,
        exercise,
        smoothing_alpha=0.30,
    ):

        self.model_path = str(
            model_path
        )

        self.exercise = exercise

        self.smoothing_alpha = (
            smoothing_alpha
        )

        self.analyzer = create_analyzer(
            exercise,
            smoothing_alpha=smoothing_alpha,
        )

        self.reps = 0
        self.phase = "rest"
        self.filtered_value = None
        self.last_rep_time = 0.0

        self.current_side = None

        if exercise.key == "lunge":

            self.side_lock_seconds = 1.5
            self.max_lost_side_frames = 30

        else:

            self.side_lock_seconds = 0.75
            self.max_lost_side_frames = 15

        self.last_side_switch_time = 0.0
        self.lost_side_frames = 0

        self.min_value = None
        self.max_value = None

        self.previous_landmarks = None
        self.unstable_landmarks = set()
        self.valid_tracking_frames = 0
        self.invalid_tracking_frames = 0
        self.tracking_state = 'recovering'
        self.transition_target = None
        self.transition_count = 0
        self.cycle_min = None
        self.cycle_max = None

        self.landmarker = (
            self._create_landmarker()
        )

    # ========================================================
    # CREATE MODEL
    # ========================================================

    def _create_landmarker(self):

        model = Path(
            self.model_path
        )

        if not model.exists():

            raise FileNotFoundError(
                f"Pose model not found: {model}"
            )

        options = (
            mp.tasks.vision
            .PoseLandmarkerOptions(

                base_options=(
                    mp.tasks.BaseOptions(
                        model_asset_path=str(model)
                    )
                ),

                running_mode=(
                    mp.tasks.vision
                    .RunningMode.VIDEO
                ),

                num_poses=1,

                min_pose_detection_confidence=0.45,
                min_pose_presence_confidence=0.45,
                min_tracking_confidence=0.40,
            )
        )

        landmarker = (
            mp.tasks.vision
            .PoseLandmarker
            .create_from_options(
                options
            )
        )

        print(
            "MediaPipe model loaded:"
        )

        print(model)

        return landmarker

    # ========================================================
    # VISIBILITY
    # ========================================================

    @staticmethod
    def _visibility(
        landmark,
    ):

        value = getattr(
            landmark,
            "visibility",
            None,
        )

        if value is None:
            return 1.0

        visibility = float(value)
        presence = getattr(landmark, 'presence', None)

        if presence is None:
            return visibility

        return min(visibility, float(presence))

    def _stabilize_landmarks(self, landmarks):
        # Smooth coordinates and hold isolated implausible jumps.
        stable = []
        unstable = set()
        alpha = 0.45

        for index, landmark in enumerate(landmarks):
            current = StableLandmark(
                x=float(landmark.x),
                y=float(landmark.y),
                z=float(landmark.z),
                visibility=float(getattr(landmark, 'visibility', 1.0)),
                presence=float(getattr(landmark, 'presence', 1.0)),
            )

            if self.previous_landmarks is None:
                stable.append(current)
                continue

            previous = self.previous_landmarks[index]
            displacement = distance(previous, current)

            if displacement > self.exercise.landmark_jump_threshold:
                unstable.add(index)
                stable.append(previous)
                continue

            stable.append(
                StableLandmark(
                    x=alpha * current.x + (1.0 - alpha) * previous.x,
                    y=alpha * current.y + (1.0 - alpha) * previous.y,
                    z=alpha * current.z + (1.0 - alpha) * previous.z,
                    visibility=current.visibility,
                    presence=current.presence,
                )
            )

        self.previous_landmarks = stable
        self.unstable_landmarks = unstable
        return stable

    # ========================================================
    # SIDE
    # ========================================================

    @staticmethod
    def _side_from_landmark_set(
        landmark_set,
    ):

        first = landmark_set[0]

        if first in LEFT_IDS:
            return "left"

        if first in RIGHT_IDS:
            return "right"

        return "unknown"

    # ========================================================
    # VISIBILITY SCORE
    # ========================================================

    def _visibility_score(
        self,
        landmarks,
        landmark_set,
    ):

        values = [

            self._visibility(
                landmarks[index]
            )

            for index
            in landmark_set
        ]

        minimum = min(values)

        average = (
            sum(values)
            / len(values)
        )

        return (
            minimum,
            average,
        )

    # ========================================================
    # SIDE LANDMARK SET
    # ========================================================

    def _set_for_side(
        self,
        side,
    ):

        for landmark_set in (
            self.exercise.landmark_sets
        ):

            if (
                self._side_from_landmark_set(
                    landmark_set
                )
                == side
            ):

                return landmark_set

        return None

    # ========================================================
    # FIND BEST SIDE
    # ========================================================

    def _find_best_side(
        self,
        landmarks,
    ):

        candidates = []

        for landmark_set in (
            self.exercise.landmark_sets
        ):

            minimum, average = (
                self._visibility_score(
                    landmarks,
                    landmark_set,
                )
            )

            if (
                average
                >=
                self.exercise
                .visibility_threshold
                and
                minimum >= 0.12
            ):

                candidates.append(
                    (
                        average,
                        landmark_set,
                        self._side_from_landmark_set(
                            landmark_set
                        ),
                    )
                )

        # Temporarily lost
        if not candidates:
            self.lost_side_frames += 1
            return None, None

        self.lost_side_frames = 0

        candidates.sort(
            key=lambda item: item[0],
            reverse=True,
        )

        _, best_set, best_side = (
            candidates[0]
        )

        now = time.monotonic()

        # First detection
        if self.current_side is None:

            self.current_side = best_side

            self.last_side_switch_time = (
                now
            )

            return (
                best_set,
                best_side,
            )

        # Try to keep current side
        current_set = (
            self._set_for_side(
                self.current_side
            )
        )

        if current_set:

            minimum, average = (
                self._visibility_score(
                    landmarks,
                    current_set,
                )
            )

            relaxed_threshold = (
                self.exercise
                .visibility_threshold
                * 0.55
            )

            if (
                average
                >= relaxed_threshold
                and
                minimum >= 0.08
            ):

                return (
                    current_set,
                    self.current_side,
                )

        # Switch only if current side is really lost
        if (
            best_side
            !=
            self.current_side
        ):

            if (
                self.phase in {"up", "rest"}
                and
                now
                -
                self.last_side_switch_time
                >=
                self.side_lock_seconds
            ):

                self.current_side = (
                    best_side
                )

                self.last_side_switch_time = (
                    now
                )

        selected = (
            self._set_for_side(
                self.current_side
            )
        )

        if selected is None:
            selected = best_set

        return (
            selected,
            self.current_side,
        )

    # ========================================================
    # ANGLE REPS
    # ========================================================

    def _update_angle_reps(
        self,
        value,
    ):
        self._update_reps(
            value=value,
            low_threshold=self.exercise.down_angle,
            high_threshold=self.exercise.up_angle,
        )

    # ========================================================
    # SHOULDER REPS
    # ========================================================

    def _update_shoulder_reps(
        self,
        angle,
    ):
        self._update_angle_reps(angle)

    def _confirm_transition(self, target):
        if self.transition_target != target:
            self.transition_target = target
            self.transition_count = 1
        else:
            self.transition_count += 1

        if self.transition_count < self.exercise.transition_frames:
            return False

        self.transition_target = None
        self.transition_count = 0
        return True

    def _clear_transition(self):
        self.transition_target = None
        self.transition_count = 0

    def _update_reps(self, value, low_threshold, high_threshold):
        self.cycle_min = value if self.cycle_min is None else min(self.cycle_min, value)
        self.cycle_max = value if self.cycle_max is None else max(self.cycle_max, value)

        if self.phase == "up" and value <= low_threshold:
            if self._confirm_transition("down"):
                self.phase = "down"
                self.cycle_min = value
                self.cycle_max = value
            return

        if self.phase == "down" and value >= high_threshold:
            if not self._confirm_transition("up"):
                return

            excursion = (self.cycle_max or value) - (self.cycle_min or value)
            now = time.monotonic()

            if (
                excursion >= self.exercise.min_rep_range
                and now - self.last_rep_time >= self.exercise.rep_cooldown
            ):
                self.reps += 1
                self.last_rep_time = now

            self.phase = "rest"
            self.cycle_min = value
            self.cycle_max = value
            return

        self._clear_transition()

    # ========================================================
    # CALF METRIC
    # ========================================================

    def _calf_raise_metric(
        self,
        landmarks,
        landmark_set,
    ):

        knee = landmarks[
            landmark_set[0]
        ]

        ankle = landmarks[
            landmark_set[1]
        ]

        heel = landmarks[
            landmark_set[2]
        ]

        foot = landmarks[
            landmark_set[3]
        ]

        leg_length = distance(
            knee,
            ankle,
        )

        if leg_length < 0.0001:
            return 0.0

        heel_lift = (
            foot.y
            -
            heel.y
        )

        return (
            heel_lift
            /
            leg_length
        )

    # ========================================================
    # CALF REPS
    # ========================================================

    def _update_calf_reps(
        self,
        ratio,
    ):
        # Calf movement increases from the rest ratio to the raise ratio,
        # so invert it to reuse the same low-then-high state machine.
        self._update_reps(
            value=-ratio,
            low_threshold=-self.exercise.calf_raise_ratio,
            high_threshold=-self.exercise.calf_rest_ratio,
        )

    # ========================================================
    # STATS
    # ========================================================

    def _required_landmarks_valid(self, landmarks, landmark_set):
        minimum, average = self._visibility_score(landmarks, landmark_set)
        inside_frame = all(
            -0.03 <= landmarks[index].x <= 1.03
            and -0.03 <= landmarks[index].y <= 1.03
            for index in landmark_set
        )
        no_jump = not any(index in self.unstable_landmarks for index in landmark_set)

        return (
            average >= self.exercise.visibility_threshold
            and minimum >= 0.12
            and inside_frame
            and no_jump
        )

    def _update_tracking_state(self, valid):
        if valid:
            self.invalid_tracking_frames = 0
            self.valid_tracking_frames += 1

            if self.valid_tracking_frames >= self.exercise.recovery_frames:
                self.tracking_state = "stable"
                return True

            self.tracking_state = "recovering"
            return False

        self.valid_tracking_frames = 0
        self.invalid_tracking_frames += 1
        self._clear_transition()

        if self.invalid_tracking_frames <= self.exercise.lost_grace_frames:
            self.tracking_state = "occluded"
        else:
            self.tracking_state = "lost"
            self.phase = "rest"
            self.filtered_value = None
            self.cycle_min = None
            self.cycle_max = None
            self.previous_landmarks = None
            self.unstable_landmarks = set()

        return False

    def _update_stats(
        self,
        value,
    ):

        if self.min_value is None:

            self.min_value = value

        else:

            self.min_value = min(
                self.min_value,
                value,
            )

        if self.max_value is None:

            self.max_value = value

        else:

            self.max_value = max(
                self.max_value,
                value,
            )

    # ========================================================
    # PROCESS
    # ========================================================

    def process_frame(
        self,
        frame,
        timestamp_ms,
    ):

        rgb = cv2.cvtColor(
            frame,
            cv2.COLOR_BGR2RGB,
        )

        mp_image = mp.Image(

            image_format=
                mp.ImageFormat.SRGB,

            data=rgb,
        )

        detection = (
            self.landmarker
            .detect_for_video(

                mp_image,

                timestamp_ms,
            )
        )

        result = {

            "pose_detected":
                False,

            "exercise":
                self.exercise.name,

            "side":
                self.current_side,

            "value":
                None,

            "angle":
                None,

            "reps":
                self.reps,

            "phase":
                self.phase,

            "form_ok":
                False,

            "feedback":
                "No pose detected.",

            "confidence":
                0.0,

            "landmarks":
                None,

            "landmark_set":
                None,

            "min_value":
                self.min_value,

            "max_value":
                self.max_value,

            "normalized_rom":
                0.0,

            "form_score":
                0,

            "min_angle":
                None,

            "max_angle":
                None,

            "hold_seconds":
                0.0,

            "duration_seconds":
                0.0,

            "raw_metric":
                None,

            "smoothed_metric":
                None,

            "active_constraints":
                [],

            "tracking_state":
                self.tracking_state,

            "invalid_tracking_frames":
                self.invalid_tracking_frames,

            "unstable_landmarks":
                [],
        }

        if not detection.pose_landmarks:
            self._update_tracking_state(False)
            if self.tracking_state == "lost":
                self.analyzer.tracking_lost()
            result["tracking_state"] = self.tracking_state
            result["invalid_tracking_frames"] = self.invalid_tracking_frames
            return result

        landmarks = self._stabilize_landmarks(
            detection.pose_landmarks[0]
        )

        result[
            "pose_detected"
        ] = True

        result[
            "landmarks"
        ] = landmarks

        result["unstable_landmarks"] = sorted(self.unstable_landmarks)

        if self.exercise.bilateral:
            landmark_set = self.exercise.landmark_sets[0]
            side = "bilateral"
        else:
            landmark_set, side = self._find_best_side(landmarks)

        if landmark_set is None:
            self._update_tracking_state(False)
            if self.tracking_state == "lost":
                self.analyzer.tracking_lost()
            result["tracking_state"] = self.tracking_state
            result["invalid_tracking_frames"] = self.invalid_tracking_frames
            result[
                "feedback"
            ] = (
                "Move slightly so the "
                "required joints are visible."
            )

            return result

        result[
            "landmark_set"
        ] = landmark_set

        result[
            "side"
        ] = side

        visibility_values = [

            self._visibility(
                landmarks[index]
            )

            for index
            in landmark_set
        ]

        result[
            "confidence"
        ] = round(
            sum(visibility_values)
            /
            len(visibility_values),
            3,
        )

        tracking_ready = self._update_tracking_state(
            self._required_landmarks_valid(landmarks, landmark_set)
        )
        result["tracking_state"] = self.tracking_state
        result["invalid_tracking_frames"] = self.invalid_tracking_frames

        if not tracking_ready:
            if self.tracking_state == "recovering":
                result["feedback"] = "Hold still briefly while tracking stabilizes."
            elif self.tracking_state == "occluded":
                result["feedback"] = "Tracking interrupted. Keep all required joints visible."
            else:
                result["feedback"] = "Tracking lost. Move fully back into frame."
                self.analyzer.tracking_lost()
            return result

        analysis = self.analyzer.process(
            landmarks=landmarks,
            side=side,
            landmark_set=landmark_set,
            confidence=result["confidence"],
            timestamp_s=timestamp_ms / 1000.0,
        )
        result.update(analysis)
        result["pose_detected"] = True
        result["tracking_state"] = self.tracking_state
        result["landmarks"] = landmarks
        result["landmark_set"] = landmark_set
        result["unstable_landmarks"] = sorted(self.unstable_landmarks)

        self.reps = self.analyzer.reps
        self.phase = self.analyzer.phase
        self.filtered_value = self.analyzer.smoothed_metric
        self.min_value = self.analyzer.min_metric
        self.max_value = self.analyzer.max_metric
        return result

        # ====================================================
        # CALF RAISE
        # ====================================================

        if (
            self.exercise
            .detection_mode
            ==
            "calf_raise"
        ):

            raw_value = (
                self._calf_raise_metric(
                    landmarks,
                    landmark_set,
                )
            )

            value = ema(
                self.filtered_value,
                raw_value,
                0.25,
            )

            self.filtered_value = (
                value
            )

            self._update_stats(
                value
            )

            self._update_calf_reps(
                value
            )

            form_ok = (
                value
                >=
                self.exercise
                .calf_rest_ratio
            )

            if (
                value
                >=
                self.exercise
                .calf_raise_ratio
            ):

                feedback = (
                    "Good heel raise."
                )

            else:

                feedback = (
                    "Raise your heel higher."
                )

            result.update(
                {

                    "value":
                        round(
                            value,
                            3,
                        ),

                    "angle":
                        None,

                    "reps":
                        self.reps,

                    "phase":
                        self.phase,

                    "form_ok":
                        form_ok,

                    "feedback":
                        feedback,

                    "min_value":
                        round(
                            self.min_value,
                            3,
                        ),

                    "max_value":
                        round(
                            self.max_value,
                            3,
                        ),
                }
            )

            return result

        # ====================================================
        # ANGLE EXERCISES
        # ====================================================

        p1 = landmarks[
            landmark_set[0]
        ]

        p2 = landmarks[
            landmark_set[1]
        ]

        p3 = landmarks[
            landmark_set[2]
        ]

        raw_angle = calculate_angle(
            p1,
            p2,
            p3,
        )

        angle = ema(
            self.filtered_value,
            raw_angle,
            self.smoothing_alpha,
        )

        self.filtered_value = (
            angle
        )

        self._update_stats(
            angle
        )

        if (
            self.exercise.key
            in
            {
                "shoulder_raise",
                "shoulder_abduction",
            }
        ):

            self._update_shoulder_reps(
                angle
            )

        else:

            self._update_angle_reps(
                angle
            )

        form_ok = (
            angle
            >=
            self.exercise
            .failure_angle
        )

        feedback = (

            self.exercise.good_feedback

            if form_ok

            else

            self.exercise.bad_feedback
        )

        result.update(
            {

                "value":
                    round(
                        angle,
                        1,
                    ),

                "angle":
                    round(
                        angle,
                        1,
                    ),

                "reps":
                    self.reps,

                "phase":
                    self.phase,

                "form_ok":
                    form_ok,

                "feedback":
                    feedback,

                "min_value":
                    round(
                        self.min_value,
                        1,
                    ),

                "max_value":
                    round(
                        self.max_value,
                        1,
                    ),
            }
        )

        return result

    # ========================================================
    # RESET
    # ========================================================

    def reset(self):

        self.reps = 0
        self.phase = "rest"

        self.filtered_value = None

        self.last_rep_time = 0.0

        self.current_side = None

        self.last_side_switch_time = 0.0

        self.lost_side_frames = 0

        self.min_value = None
        self.max_value = None

        self.previous_landmarks = None
        self.unstable_landmarks = set()
        self.valid_tracking_frames = 0
        self.invalid_tracking_frames = 0
        self.tracking_state = "recovering"
        self.transition_target = None
        self.transition_count = 0
        self.cycle_min = None
        self.cycle_max = None

        self.analyzer.reset()
        self.phase = self.analyzer.phase

    # ========================================================
    # CLOSE
    # ========================================================

    def close(self):

        if self.landmarker:

            self.landmarker.close()


# ============================================================
# DRAW RESULT
# ============================================================

STICK_FIGURE_CONNECTIONS = (
    (11, 12),
    (11, 13), (13, 15),
    (12, 14), (14, 16),
    (11, 23), (12, 24), (23, 24),
    (23, 25), (25, 27), (27, 31),
    (24, 26), (26, 28), (28, 32),
)

STICK_FIGURE_JOINTS = {
    11, 12, 13, 14, 15, 16,
    23, 24, 25, 26, 27, 28, 31, 32,
}


class SkeletonDebugger:
    def __init__(self, trail_length=18):
        self.trails = {
            index: deque(maxlen=trail_length)
            for index in range(33)
        }

    def reset(self):
        for trail in self.trails.values():
            trail.clear()

    def render(self, result, width=640, height=480, mirrored=True):
        canvas = 20 * np.ones((height, width, 3), dtype=np.uint8)
        landmarks = result.get("landmarks")

        if landmarks is None:
            self._draw_status(canvas, result)
            return canvas

        points = []
        unstable = set(result.get("unstable_landmarks") or [])
        selected = set(result.get("landmark_set") or [])

        for index, landmark in enumerate(landmarks):
            x = int(landmark.x * width)
            y = int(landmark.y * height)
            if mirrored:
                x = width - 1 - x
            points.append((x, y))

            if index in selected and 0 <= x < width and 0 <= y < height:
                self.trails[index].append((x, y))

        for index in selected:
            trail = self.trails[index]
            if len(trail) < 2:
                continue
            for segment in range(1, len(trail)):
                strength = segment / len(trail)
                color = (0, int(190 * strength), int(255 * strength))
                cv2.line(canvas, trail[segment - 1], trail[segment], color, 2)

        torso_ids = (11, 12, 24, 23)
        if all(self._visibility(landmarks[index]) >= 0.12 for index in torso_ids):
            overlay = canvas.copy()
            torso = np.array([points[index] for index in torso_ids], dtype=np.int32)
            cv2.fillConvexPoly(overlay, torso, (55, 85, 90))
            cv2.addWeighted(overlay, 0.55, canvas, 0.45, 0, canvas)

        if self._visibility(landmarks[0]) >= 0.12:
            shoulder_width = abs(points[11][0] - points[12][0])
            head_radius = max(13, min(30, int(shoulder_width * 0.20)))
            head_center = points[0]
            cv2.circle(canvas, head_center, head_radius, (225, 225, 225), 3)

            shoulder_midpoint = (
                (points[11][0] + points[12][0]) // 2,
                (points[11][1] + points[12][1]) // 2,
            )
            neck_end = (head_center[0], head_center[1] + head_radius)
            cv2.line(canvas, neck_end, shoulder_midpoint, (190, 190, 190), 4)

        for start, end in STICK_FIGURE_CONNECTIONS:
            if start >= len(points) or end >= len(points):
                continue
            start_visibility = self._visibility(landmarks[start])
            end_visibility = self._visibility(landmarks[end])
            if min(start_visibility, end_visibility) < 0.12:
                continue
            is_active = start in selected and end in selected
            color = (0, 230, 255) if is_active else (205, 205, 205)
            cv2.line(canvas, points[start], points[end], color, 7 if is_active else 5)

        for index in STICK_FIGURE_JOINTS:
            point = points[index]
            visibility = self._visibility(landmarks[index])
            if visibility < 0.12:
                continue
            if index in unstable:
                color = (0, 0, 255)
            elif index in selected:
                color = (0, 255, 255)
            else:
                color = (220, 220, 220)
            radius = 8 if index in selected else 6
            cv2.circle(canvas, point, radius, (25, 25, 25), -1)
            cv2.circle(canvas, point, radius, color, 3)

        self._draw_status(canvas, result)
        return canvas

    @staticmethod
    def _visibility(landmark):
        visibility = float(getattr(landmark, "visibility", 1.0))
        presence = float(getattr(landmark, "presence", 1.0))
        return min(visibility, presence)

    @staticmethod
    def _draw_status(canvas, result):
        state = result.get("tracking_state", "--")
        state_colors = {
            "stable": (0, 210, 160),
            "recovering": (0, 220, 255),
            "occluded": (0, 165, 255),
            "lost": (0, 0, 255),
        }
        color = state_colors.get(state, (220, 220, 220))
        lines = (
            f"Tracking: {state}",
            f"Side: {result.get('side') or '--'}",
            f"Raw / smooth: {result.get('raw_metric')} / {result.get('smoothed_metric')}",
            f"ROM: {result.get('normalized_rom', 0):.2f} | Score: {result.get('form_score', 0)}",
            f"Reps: {result.get('reps', 0)} | Phase: {result.get('phase', '--')}",
            f"Hold: {result.get('hold_seconds', 0):.1f}s",
        )
        for row, line in enumerate(lines):
            cv2.putText(
                canvas,
                line,
                (15, 28 + row * 25),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                color if row == 0 else (235, 235, 235),
                2,
            )

def draw_result(
    frame,
    result,
    mirrored=False,
):

    landmarks = result.get(
        "landmarks"
    )

    landmark_set = result.get(
        "landmark_set"
    )

    if (
        landmarks is not None
        and
        landmark_set is not None
    ):

        height, width = (
            frame.shape[:2]
        )

        points = []

        for index in landmark_set:

            landmark = (
                landmarks[index]
            )

            x = int(
                landmark.x
                * width
            )

            y = int(
                landmark.y
                * height
            )

            # Landmark coordinates came from the
            # original, unmirrored image.
            #
            # If the preview is mirrored, convert
            # X so the skeleton matches the preview.
            if mirrored:

                x = (
                    width
                    - 1
                    - x
                )

            point = (
                x,
                y,
            )

            points.append(
                point
            )

        color = (

            (0, 200, 150)

            if result[
                "form_ok"
            ]

            else

            (0, 0, 255)
        )

        for index in range(
            len(points) - 1
        ):

            cv2.line(

                frame,

                points[index],

                points[index + 1],

                color,

                4,
            )

        for point in points:

            cv2.circle(

                frame,

                point,

                6,

                color,

                -1,
            )

    # ========================================================
    # TEXT
    # ========================================================
    #
    # Text is drawn AFTER the mirror transformation,
    # therefore it remains readable.
    # ========================================================

    cv2.rectangle(
        frame,
        (10, 10),
        (470, 180),
        (20, 20, 20),
        -1,
    )

    cv2.putText(
        frame,

        f"Exercise: "
        f"{result['exercise']}",

        (20, 40),

        cv2.FONT_HERSHEY_SIMPLEX,

        0.65,

        (255, 255, 255),

        2,
    )

    cv2.putText(
        frame,

        f"Side: "
        f"{result.get('side') or '--'}",

        (20, 70),

        cv2.FONT_HERSHEY_SIMPLEX,

        0.65,

        (0, 255, 255),

        2,
    )

    value = result.get(
        "value"
    )

    value_text = (

        "--"

        if value is None

        else str(value)
    )

    cv2.putText(
        frame,

        f"Value: "
        f"{value_text}",

        (20, 100),

        cv2.FONT_HERSHEY_SIMPLEX,

        0.65,

        (255, 255, 255),

        2,
    )

    cv2.putText(
        frame,

        f"Reps: "
        f"{result['reps']} "
        f"| Phase: "
        f"{result['phase']}",

        (20, 130),

        cv2.FONT_HERSHEY_SIMPLEX,

        0.65,

        (255, 255, 255),

        2,
    )

    cv2.putText(
        frame,

        result[
            "feedback"
        ],

        (20, 160),

        cv2.FONT_HERSHEY_SIMPLEX,

        0.52,

        (
            (0, 200, 150)

            if result[
                "form_ok"
            ]

            else

            (0, 0, 255)
        ),

        2,
    )

    return frame
