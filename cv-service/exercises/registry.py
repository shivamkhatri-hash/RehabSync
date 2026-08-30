from dataclasses import dataclass
from typing import Dict, Tuple


@dataclass(frozen=True)
class ExerciseConfig:
    key: str
    name: str
    analyzer: str
    landmark_sets: Tuple[tuple, ...]
    rest_value: float
    target_value: float
    target_direction: str = "decrease"
    visibility_threshold: float = 0.30
    rep_cooldown: float = 0.70
    transition_frames: int = 4
    recovery_frames: int = 5
    lost_grace_frames: int = 7
    landmark_jump_threshold: float = 0.14
    min_rep_range: float = 25.0
    bilateral: bool = False
    secondary_threshold: float = 0.0
    good_feedback: str = "Good controlled movement."
    bad_feedback: str = "Move slowly through a comfortable range."
    camera_guidance: str = "Keep the required joints visible in the frame."
    aliases: Tuple[str, ...] = ()

    # Compatibility properties retained for the Flask metadata endpoint and
    # older local callers. Thresholds are configurable prototype defaults.
    @property
    def down_angle(self):
        return min(self.rest_value, self.target_value)

    @property
    def up_angle(self):
        return max(self.rest_value, self.target_value)

    @property
    def failure_angle(self):
        return self.target_value

    @property
    def detection_mode(self):
        return self.analyzer

    @property
    def calf_rest_ratio(self):
        return self.rest_value

    @property
    def calf_raise_ratio(self):
        return self.target_value


LEFT_ARM = (11, 13, 15)
RIGHT_ARM = (12, 14, 16)
LEFT_KNEE = (23, 25, 27)
RIGHT_KNEE = (24, 26, 28)
LEFT_HIP = (11, 23, 25)
RIGHT_HIP = (12, 24, 26)
LEFT_SHOULDER = (23, 11, 13)
RIGHT_SHOULDER = (24, 12, 14)


def _config(key, name, analyzer, landmark_sets, rest, target, **kwargs):
    return ExerciseConfig(
        key=key,
        name=name,
        analyzer=analyzer,
        landmark_sets=landmark_sets,
        rest_value=rest,
        target_value=target,
        **kwargs,
    )


EXERCISES: Dict[str, ExerciseConfig] = {
    "seated_knee_extension": _config(
        "seated_knee_extension", "Seated Knee Extension", "knee_extension",
        (LEFT_KNEE, RIGHT_KNEE), 105, 160, target_direction="increase",
        transition_frames=5, min_rep_range=35,
        good_feedback="Good knee extension. Return with control.",
        bad_feedback="Straighten the knee a little more without forcing it.",
        camera_guidance="Sit side-on at 30-45 degrees with hip, knee, and ankle visible.",
        aliases=("seated knee extensions",),
    ),
    "straight_leg_raise": _config(
        "straight_leg_raise", "Straight Leg Raise", "straight_leg_raise",
        (LEFT_HIP, RIGHT_HIP), 165, 115, secondary_threshold=145,
        transition_frames=5, recovery_frames=7, min_rep_range=30,
        good_feedback="Good leg raise with a straight knee.",
        bad_feedback="Keep your knee straighter and raise only as comfortable.",
        camera_guidance="Use a side view and keep shoulder, hip, knee, and ankle visible.",
        aliases=("slr",),
    ),
    "mini_squat": _config(
        "mini_squat", "Mini Squat", "mini_squat",
        ((23, 25, 27, 24, 26, 28, 11, 12),), 165, 125,
        bilateral=True, transition_frames=5, min_rep_range=25,
        good_feedback="Good mini-squat depth and control.",
        bad_feedback="Keep both knees visible and your trunk steady.",
        camera_guidance="Face the camera at a slight angle with both legs fully visible.",
    ),
    "sit_to_stand": _config(
        "sit_to_stand", "Sit-to-Stand", "sit_to_stand",
        ((11, 12, 23, 24, 25, 26, 27, 28),), 105, 160,
        target_direction="increase", bilateral=True, transition_frames=6,
        recovery_frames=7, min_rep_range=35,
        good_feedback="Full stand reached. Sit down with control.",
        bad_feedback="Keep both feet visible and complete the stand-and-return cycle.",
        camera_guidance="Place the camera side-front so the chair, hips, knees, and ankles are visible.",
        aliases=("sit to stand", "sit stand"),
    ),
    "standing_knee_flexion": _config(
        "standing_knee_flexion", "Standing Knee Flexion", "knee_flexion",
        (LEFT_KNEE, RIGHT_KNEE), 165, 100, transition_frames=5,
        recovery_frames=7, min_rep_range=35,
        good_feedback="Good knee bend. Lower the foot with control.",
        bad_feedback="Bend the knee without moving the hip forward.",
        camera_guidance="Stand side-on with the working hip, knee, and ankle visible.",
    ),
    "standing_hip_abduction": _config(
        "standing_hip_abduction", "Standing Hip Abduction", "hip_abduction",
        ((23, 25, 27), (24, 26, 28)), 0.05, 0.28,
        target_direction="increase", min_rep_range=0.14, secondary_threshold=0.16,
        good_feedback="Good sideways leg movement.",
        bad_feedback="Move the leg sideways and keep your trunk upright.",
        camera_guidance="Face the camera with both hips and the working leg visible.",
    ),
    "standing_hip_flexion": _config(
        "standing_hip_flexion", "Standing Hip Flexion", "hip_flexion",
        (LEFT_HIP, RIGHT_HIP), 165, 115, transition_frames=5,
        min_rep_range=30, secondary_threshold=0.05,
        good_feedback="Good controlled knee lift.",
        bad_feedback="Lift the knee forward without leaning back.",
        camera_guidance="Use a side view with shoulder, hip, knee, and ankle visible.",
        aliases=("standing march",),
    ),
    "shoulder_flexion": _config(
        "shoulder_flexion", "Shoulder Flexion", "shoulder_flexion",
        (LEFT_SHOULDER, RIGHT_SHOULDER), 20, 105,
        target_direction="increase", min_rep_range=55,
        good_feedback="Good forward shoulder elevation.",
        bad_feedback="Raise the arm forward without leaning your trunk.",
        camera_guidance="Use a side view with hip, shoulder, elbow, and wrist visible.",
        aliases=("shoulder raise", "shoulder raises"),
    ),
    "shoulder_abduction": _config(
        "shoulder_abduction", "Shoulder Abduction", "shoulder_abduction",
        (LEFT_SHOULDER, RIGHT_SHOULDER), 20, 95,
        target_direction="increase", min_rep_range=50,
        good_feedback="Good lateral shoulder elevation.",
        bad_feedback="Raise the arm sideways and avoid leaning.",
        camera_guidance="Face the camera with hip, shoulder, elbow, and wrist visible.",
    ),
    "bicep_curl": _config(
        "bicep_curl", "Bicep Curl", "elbow_flexion",
        (LEFT_ARM, RIGHT_ARM), 150, 85, min_rep_range=40,
        good_feedback="Good elbow flexion. Keep the elbow controlled.",
        bad_feedback="Keep your upper arm horizontal (elbow at shoulder height).",
        camera_guidance="Raise your upper arm horizontally to shoulder level and face the camera.",
        aliases=("biceps curl", "elbow flexion", "elbow_flexion"),
    ),
    "wall_slides": _config(
        "wall_slides", "Wall Slides", "wall_slide",
        ((23, 24, 11, 12, 13, 14, 15, 16),), 25, 100,
        target_direction="increase", bilateral=True, min_rep_range=45,
        secondary_threshold=22,
        good_feedback="Good symmetrical wall slide.",
        bad_feedback="Move both arms together and keep the trunk steady.",
        camera_guidance="Face the camera with both arms, shoulders, and hips visible.",
        aliases=("wall slide",),
    ),
    "calf_raise": _config(
        "calf_raise", "Calf Raise", "calf_raise",
        ((25, 27, 29, 31), (26, 28, 30, 32)), 0.025, 0.070,
        target_direction="increase", visibility_threshold=0.25,
        transition_frames=6, recovery_frames=8, min_rep_range=0.025,
        landmark_jump_threshold=0.08,
        good_feedback="Good heel raise. Lower with control.",
        bad_feedback="Raise the heel while keeping the knee controlled.",
        camera_guidance="Use a side view and include knee, ankle, heel, and toes.",
        aliases=("standing calf raise", "calf raises"),
    ),
    "marching_in_place": _config(
        "marching_in_place", "Marching in Place", "marching",
        ((11, 12, 23, 24, 25, 26, 27, 28),), 160, 120,
        bilateral=True, transition_frames=4, min_rep_range=25,
        good_feedback="Good alternating march.",
        bad_feedback="Lift one knee at a time and return it before the next step.",
        camera_guidance="Face the camera at a slight angle with both legs visible.",
        aliases=("marching", "march in place"),
    ),
    "single_leg_balance": _config(
        "single_leg_balance", "Single-Leg Balance", "balance",
        ((11, 12, 23, 24, 25, 26, 27, 28),), 0.02, 0.10,
        target_direction="increase", bilateral=True, min_rep_range=0.04,
        good_feedback="Balance hold active.",
        bad_feedback="Lift one foot slightly and keep your body steady.",
        camera_guidance="Face the camera with your whole body and both feet visible.",
        aliases=("single leg balance", "one leg balance"),
    ),
    "bird_dog": _config(
        "bird_dog", "Bird Dog", "bird_dog",
        ((11, 12, 15, 16, 23, 24, 27, 28),), 0.45, 0.80,
        target_direction="increase", bilateral=True, min_rep_range=0.20,
        good_feedback="Good opposite arm and leg extension.",
        bad_feedback="Extend the opposite arm and leg while keeping the trunk steady.",
        camera_guidance="Use a side-front view with both wrists, hips, and ankles visible.",
    ),

    # Secondary/general exercises retained from the original prototype.
    "push_up": _config(
        "push_up", "Push-up", "push_up", (LEFT_ARM, RIGHT_ARM), 155, 105,
        min_rep_range=35, camera_guidance="Use a side view with the full body visible.",
        aliases=("pushup",),
    ),
    "squat": _config(
        "squat", "Squat", "squat", (LEFT_KNEE, RIGHT_KNEE), 165, 100,
        min_rep_range=40, camera_guidance="Use a side-front full-body view."),
    "lunge": _config(
        "lunge", "Lunge", "squat", (LEFT_KNEE, RIGHT_KNEE), 160, 105,
        transition_frames=6, recovery_frames=8, lost_grace_frames=10,
        landmark_jump_threshold=0.10, min_rep_range=35,
        camera_guidance="Use a 30-45 degree view with both legs visible."),
    "crunch": _config(
        "crunch", "Crunch", "angle", (LEFT_HIP, RIGHT_HIP), 115, 80,
        min_rep_range=20, camera_guidance="Use a side view with shoulder, hip, and knee visible."),
}


def _normal_form(name: str) -> str:
    normalized = name.strip().lower().replace("-", " ").replace("_", " ")
    return " ".join(normalized.split())


ALIASES = {}
for key, config in EXERCISES.items():
    for alias in (key, config.name, *config.aliases):
        ALIASES[_normal_form(alias)] = key

# Legacy names point at the corresponding rehabilitation analyzer/config.
ALIASES.update({
    "knee extension": "seated_knee_extension",
    "knee extensions": "seated_knee_extension",
    "leg raise": "straight_leg_raise",
    "leg raises": "straight_leg_raise",
    "shoulder raise": "shoulder_flexion",
    "calf raise": "calf_raise",
})


def normalize_exercise_key(name: str) -> str:
    if not isinstance(name, str):
        raise ValueError("Exercise name must be a string.")
    normalized = _normal_form(name)
    return ALIASES.get(normalized, normalized.replace(" ", "_"))


def get_exercise(name: str) -> ExerciseConfig:
    key = normalize_exercise_key(name)
    if key not in EXERCISES:
        available = ", ".join(get_exercise_names())
        raise ValueError(f"Unknown exercise '{name}'. Available exercises: {available}")
    return EXERCISES[key]


def list_exercises():
    return list(EXERCISES.values())


def get_exercise_names():
    return [exercise.name for exercise in EXERCISES.values()]
