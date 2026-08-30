from geometry import calculate_angle

from .base import BaseAnalyzer


class JointAngleAnalyzer(BaseAnalyzer):
    def measure(self, landmarks, side, landmark_set):
        a, b, c = (landmarks[index] for index in landmark_set[:3])
        return calculate_angle(a, b, c)


class ElbowFlexionAnalyzer(JointAngleAnalyzer):
    def form_check(self, landmarks, side, landmark_set, metric):
        hip_idx = 23 if side == "left" else 24
        hip = landmarks[hip_idx]
        shoulder, elbow, _ = (landmarks[index] for index in landmark_set[:3])
        
        shoulder_angle = calculate_angle(hip, shoulder, elbow)
        
        ok = 70.0 <= shoulder_angle <= 110.0
        feedback = self.config.good_feedback if ok else "Keep your upper arm horizontal."
        return ok, feedback, [f"shoulder_abduction={shoulder_angle:.1f}"]


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


class BicepCurlShoulderAnalyzer(JointAngleAnalyzer):
    def form_check(self, landmarks, side, landmark_set, metric):
        wrist_idx = 15 if side == "left" else 16
        shoulder, elbow, _ = (landmarks[index] for index in landmark_set[:3])
        wrist = landmarks[wrist_idx]
        
        elbow_angle = calculate_angle(shoulder, elbow, wrist)
        
        ok = abs(elbow_angle - 90.0) <= 15.0
        feedback = self.config.good_feedback if ok else "Keep your elbow at 90 degrees."
        return ok, feedback, [f"elbow_angle={elbow_angle:.1f}"]

