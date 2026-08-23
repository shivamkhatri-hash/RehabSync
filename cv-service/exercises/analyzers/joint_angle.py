from geometry import calculate_angle

from .base import BaseAnalyzer


class JointAngleAnalyzer(BaseAnalyzer):
    def measure(self, landmarks, side, landmark_set):
        a, b, c = (landmarks[index] for index in landmark_set[:3])
        return calculate_angle(a, b, c)


class ElbowFlexionAnalyzer(JointAngleAnalyzer):
    def form_check(self, landmarks, side, landmark_set, metric):
        shoulder, elbow, _ = (landmarks[index] for index in landmark_set[:3])
        elbow_drift = abs(elbow.x - shoulder.x)
        ok = elbow_drift <= 0.22
        constraints = [f"elbow_drift={elbow_drift:.3f}"]
        feedback = self.config.good_feedback if ok else "Keep your elbow closer to your side."
        return ok, feedback, constraints


class KneeExtensionAnalyzer(JointAngleAnalyzer):
    pass


class KneeFlexionAnalyzer(JointAngleAnalyzer):
    pass


class SquatAnalyzer(JointAngleAnalyzer):
    pass


class ShoulderFlexionAnalyzer(JointAngleAnalyzer):
    def form_check(self, landmarks, side, landmark_set, metric):
        hip, shoulder, _ = (landmarks[index] for index in landmark_set[:3])
        trunk_offset = abs(shoulder.x - hip.x)
        ok = trunk_offset <= 0.20
        feedback = self.config.good_feedback if ok else "Keep your trunk upright while raising the arm."
        return ok, feedback, [f"trunk_offset={trunk_offset:.3f}"]


class ShoulderAbductionAnalyzer(ShoulderFlexionAnalyzer):
    pass


class PushUpAnalyzer(JointAngleAnalyzer):
    def form_check(self, landmarks, side, landmark_set, metric):
        if side == "left":
            shoulder, hip, ankle = landmarks[11], landmarks[23], landmarks[27]
        else:
            shoulder, hip, ankle = landmarks[12], landmarks[24], landmarks[28]
        body_angle = calculate_angle(shoulder, hip, ankle)
        ok = body_angle >= 150
        feedback = self.config.good_feedback if ok else "Keep shoulder, hip, and ankle aligned."
        return ok, feedback, [f"body_alignment={body_angle:.1f}"]
