import unittest
from types import SimpleNamespace

import numpy as np

from exercises import (
    get_exercise,
    get_exercise_names,
    list_exercises,
    normalize_exercise_key,
)
from exercises.analyzers import ANALYZERS, create_analyzer
from geometry import calculate_angle
from pose_engine import PoseEngine, SkeletonDebugger


def make_engine(exercise_name="Bicep Curl"):
    engine = PoseEngine.__new__(PoseEngine)
    engine.exercise = get_exercise(exercise_name)
    engine.reps = 0
    engine.phase = "up"
    engine.filtered_value = None
    engine.last_rep_time = -1000.0
    engine.transition_target = None
    engine.transition_count = 0
    engine.cycle_min = None
    engine.cycle_max = None
    engine.previous_landmarks = None
    engine.unstable_landmarks = set()
    engine.valid_tracking_frames = 0
    engine.invalid_tracking_frames = 0
    engine.tracking_state = "recovering"
    return engine


def landmark(x=0.5, y=0.5, visibility=1.0, presence=1.0):
    return SimpleNamespace(
        x=x,
        y=y,
        z=0.0,
        visibility=visibility,
        presence=presence,
    )


class RepStateTests(unittest.TestCase):
    def test_thresholds_must_be_held_and_only_one_rep_counts(self):
        engine = make_engine()

        for _ in range(engine.exercise.transition_frames - 1):
            engine._update_angle_reps(70.0)
        self.assertEqual(engine.phase, "up")

        engine._update_angle_reps(70.0)
        self.assertEqual(engine.phase, "down")

        for _ in range(engine.exercise.transition_frames):
            engine._update_angle_reps(165.0)
        self.assertEqual(engine.reps, 1)

        for _ in range(20):
            engine._update_angle_reps(165.0)
        self.assertEqual(engine.reps, 1)

    def test_tracking_loss_cancels_an_incomplete_rep(self):
        engine = make_engine()
        engine.phase = "down"
        engine.cycle_min = 70.0
        engine.cycle_max = 100.0

        for _ in range(engine.exercise.lost_grace_frames + 1):
            engine._update_tracking_state(False)

        self.assertEqual(engine.tracking_state, "lost")
        self.assertEqual(engine.phase, "rest")
        self.assertEqual(engine.reps, 0)

    def test_recovery_requires_multiple_stable_frames(self):
        engine = make_engine()

        for _ in range(engine.exercise.recovery_frames - 1):
            self.assertFalse(engine._update_tracking_state(True))

        self.assertTrue(engine._update_tracking_state(True))
        self.assertEqual(engine.tracking_state, "stable")


class LandmarkTests(unittest.TestCase):
    def test_large_single_frame_jump_is_held_and_flagged(self):
        engine = make_engine("Lunge")
        first = [landmark() for _ in range(33)]
        engine._stabilize_landmarks(first)

        jumped = [landmark() for _ in range(33)]
        jumped[25] = landmark(x=0.9, y=0.9)
        stable = engine._stabilize_landmarks(jumped)

        self.assertIn(25, engine.unstable_landmarks)
        self.assertAlmostEqual(stable[25].x, 0.5)
        self.assertAlmostEqual(stable[25].y, 0.5)

    def test_debug_skeleton_produces_an_image(self):
        debugger = SkeletonDebugger()
        result = {
            "landmarks": [landmark() for _ in range(33)],
            "landmark_set": (23, 25, 27),
            "unstable_landmarks": [],
            "tracking_state": "stable",
            "side": "left",
            "value": 120.0,
            "reps": 2,
            "phase": "down",
        }

        image = debugger.render(result, width=320, height=240)
        self.assertEqual(image.shape, (240, 320, 3))
        self.assertEqual(image.dtype, np.uint8)


class RehabilitationLibraryTests(unittest.TestCase):
    def test_exercise_name_normalization_and_legacy_aliases(self):
        cases = {
            "Seated Knee Extension": "seated_knee_extension",
            "seated_knee_extension": "seated_knee_extension",
            "Elbow Flexion": "bicep_curl",
            "bicep-curl": "bicep_curl",
            "Knee Extension": "seated_knee_extension",
            "Leg Raise": "straight_leg_raise",
            "Standing Calf Raise": "calf_raise",
            "Single-Leg Balance": "single_leg_balance",
        }
        for supplied, expected in cases.items():
            self.assertEqual(normalize_exercise_key(supplied), expected)

    def test_angle_calculation(self):
        a = landmark(1.0, 0.0)
        b = landmark(0.0, 0.0)
        c = landmark(0.0, 1.0)
        self.assertAlmostEqual(calculate_angle(a, b, c), 90.0)

    def test_registry_loads_core_rehabilitation_library(self):
        names = set(get_exercise_names())
        required = {
            "Seated Knee Extension", "Straight Leg Raise", "Mini Squat",
            "Sit-to-Stand", "Standing Knee Flexion", "Standing Hip Abduction",
            "Standing Hip Flexion", "Shoulder Flexion", "Shoulder Abduction",
            "Bicep Curl", "Wall Slides", "Calf Raise", "Marching in Place",
            "Single-Leg Balance", "Bird Dog",
        }
        self.assertTrue(required.issubset(names))

    def test_every_registry_entry_has_an_analyzer(self):
        for config in list_exercises():
            self.assertIn(config.analyzer, ANALYZERS)
            self.assertIsNotNone(create_analyzer(config))

    def test_every_analyzer_returns_the_common_shape(self):
        landmarks = [landmark() for _ in range(33)]
        coordinates = {
            0: (0.50, 0.10), 11: (0.42, 0.28), 12: (0.58, 0.28),
            13: (0.37, 0.42), 14: (0.63, 0.42), 15: (0.33, 0.56),
            16: (0.67, 0.56), 23: (0.46, 0.52), 24: (0.54, 0.52),
            25: (0.46, 0.71), 26: (0.54, 0.71), 27: (0.46, 0.90),
            28: (0.54, 0.90), 29: (0.45, 0.92), 30: (0.55, 0.92),
            31: (0.49, 0.93), 32: (0.51, 0.93),
        }
        for index, (x, y) in coordinates.items():
            landmarks[index] = landmark(x, y)

        required_keys = {
            "exercise", "pose_detected", "side", "reps", "phase", "angle",
            "normalized_rom", "form_ok", "form_score", "confidence",
            "feedback", "min_angle", "max_angle", "hold_seconds",
            "duration_seconds",
        }
        for config in list_exercises():
            analyzer = create_analyzer(config)
            side = "bilateral" if config.bilateral else "left"
            result = analyzer.process(
                landmarks, side, config.landmark_sets[0], 0.95, 1.0
            )
            self.assertTrue(required_keys.issubset(result), config.name)


if __name__ == "__main__":
    unittest.main()
