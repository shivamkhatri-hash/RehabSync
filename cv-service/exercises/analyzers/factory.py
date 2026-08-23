from .functional import (
    BalanceAnalyzer,
    BirdDogAnalyzer,
    MarchingAnalyzer,
    MiniSquatAnalyzer,
    SitToStandAnalyzer,
    WallSlideAnalyzer,
)
from .joint_angle import (
    ElbowFlexionAnalyzer,
    JointAngleAnalyzer,
    KneeExtensionAnalyzer,
    KneeFlexionAnalyzer,
    PushUpAnalyzer,
    ShoulderAbductionAnalyzer,
    ShoulderFlexionAnalyzer,
    SquatAnalyzer,
)
from .lower_limb import (
    CalfRaiseAnalyzer,
    HipAbductionAnalyzer,
    HipFlexionAnalyzer,
    StraightLegRaiseAnalyzer,
)


ANALYZERS = {
    "angle": JointAngleAnalyzer,
    "elbow_flexion": ElbowFlexionAnalyzer,
    "knee_extension": KneeExtensionAnalyzer,
    "straight_leg_raise": StraightLegRaiseAnalyzer,
    "mini_squat": MiniSquatAnalyzer,
    "sit_to_stand": SitToStandAnalyzer,
    "knee_flexion": KneeFlexionAnalyzer,
    "hip_abduction": HipAbductionAnalyzer,
    "hip_flexion": HipFlexionAnalyzer,
    "shoulder_flexion": ShoulderFlexionAnalyzer,
    "shoulder_abduction": ShoulderAbductionAnalyzer,
    "wall_slide": WallSlideAnalyzer,
    "calf_raise": CalfRaiseAnalyzer,
    "marching": MarchingAnalyzer,
    "balance": BalanceAnalyzer,
    "bird_dog": BirdDogAnalyzer,
    "push_up": PushUpAnalyzer,
    "squat": SquatAnalyzer,
}


def create_analyzer(config, smoothing_alpha=0.30):
    try:
        analyzer_class = ANALYZERS[config.analyzer]
    except KeyError as error:
        raise ValueError(f"No analyzer registered for '{config.analyzer}'.") from error
    return analyzer_class(config, smoothing_alpha=smoothing_alpha)
