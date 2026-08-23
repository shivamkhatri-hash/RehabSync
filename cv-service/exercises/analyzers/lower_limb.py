from geometry import calculate_angle

from .base import BaseAnalyzer, distance
from .joint_angle import JointAngleAnalyzer


class StraightLegRaiseAnalyzer(JointAngleAnalyzer):
    def form_check(self, landmarks, side, landmark_set, metric):
        if side == "left":
            knee_angle = calculate_angle(landmarks[23], landmarks[25], landmarks[27])
        else:
            knee_angle = calculate_angle(landmarks[24], landmarks[26], landmarks[28])
        ok = knee_angle >= self.config.secondary_threshold
        feedback = self.config.good_feedback if ok else "Keep your knee straighter."
        return ok, feedback, [f"knee_straightness={knee_angle:.1f}"]


class HipAbductionAnalyzer(BaseAnalyzer):
    def measure(self, landmarks, side, landmark_set):
        hip, knee, ankle = (landmarks[index] for index in landmark_set[:3])
        leg_length = distance(hip, knee) + distance(knee, ankle)
        if leg_length < 1e-6:
            return 0.0
        return abs(ankle.x - hip.x) / leg_length

    def form_check(self, landmarks, side, landmark_set, metric):
        hip = landmarks[landmark_set[0]]
        shoulder = landmarks[11 if side == "left" else 12]
        trunk_lean = abs(shoulder.x - hip.x)
        ok = trunk_lean <= self.config.secondary_threshold
        feedback = self.config.good_feedback if ok else "Keep your trunk upright as the leg moves sideways."
        return ok, feedback, [f"trunk_lean={trunk_lean:.3f}"]


class HipFlexionAnalyzer(JointAngleAnalyzer):
    pass


class CalfRaiseAnalyzer(BaseAnalyzer):
    def measure(self, landmarks, side, landmark_set):
        knee, ankle, heel, foot = (landmarks[index] for index in landmark_set[:4])
        leg_length = distance(knee, ankle)
        if leg_length < 1e-6:
            return 0.0
        return (foot.y - heel.y) / leg_length

    def result(self, *args, **kwargs):
        result = super().result(*args, **kwargs)
        result["angle"] = None
        result["min_angle"] = None
        result["max_angle"] = None
        return result
