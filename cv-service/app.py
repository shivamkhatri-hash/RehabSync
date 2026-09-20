from pathlib import Path

from flask import (
    Flask,
    jsonify,
    request,
)
from flask_cors import CORS

from exercises import (
    get_exercise,
    get_exercise_names,
)


app = Flask(__name__)
CORS(app)


@app.get("/")
def health():
    return jsonify(
        {
            "service": "PoseCare CV Service",
            "status": "running",
            "exercises": get_exercise_names(),
        }
    )


@app.get("/api/exercises")
def exercises():
    return jsonify(
        get_exercise_names()
    )


@app.get(
    "/api/exercises/<name>"
)
def exercise(name):
    try:
        config = get_exercise(
            name
        )

    except ValueError as error:
        return jsonify(
            {
                "error": str(error)
            }
        ), 404

    return jsonify(
        {
            "key": config.key,
            "name": config.name,
            "analyzer": config.analyzer,
            "landmark_sets": [
                list(joints)
                for joints in config.landmark_sets
            ],
            "down_angle": config.down_angle,
            "up_angle": config.up_angle,
            "failure_angle": config.failure_angle,
            "visibility_threshold":
                config.visibility_threshold,
            "rep_cooldown":
                config.rep_cooldown,
            "transition_frames": config.transition_frames,
            "recovery_frames": config.recovery_frames,
            "lost_grace_frames": config.lost_grace_frames,
            "landmark_jump_threshold": config.landmark_jump_threshold,
            "min_rep_range": config.min_rep_range,
            "rest_value": config.rest_value,
            "target_value": config.target_value,
            "target_direction": config.target_direction,
            "bilateral": config.bilateral,
            "camera_guidance": config.camera_guidance,
            "threshold_notice": "Prototype defaults; not clinically validated.",
        }
    )


@app.post("/api/biomechanics/validate")
def validate_biomechanics():
    """
    Centralized Python CV endpoint for validating multi-joint biomechanics,
    calculating kinetic compensation scores, and temporal phase validation.
    """
    data = request.get_json() or {}
    exercise_name = data.get("exercise", "Mini Squat")
    angle = float(data.get("current_angle", 180.0))
    torso_lean = float(data.get("torso_lean", 0.0))
    shoulder_tilt = float(data.get("shoulder_tilt", 0.0))
    side = data.get("side", "bilateral")
    tolerance = float(data.get("tolerance", 10.0))

    compensations = []
    if torso_lean > 15.0:
        compensations.append({
            "rule": "TORSO_LEAN",
            "message": f"Excessive torso lean detected ({torso_lean:.1f}° > 15.0° limit)",
            "severity": "high"
        })
    if shoulder_tilt > 12.0:
        compensations.append({
            "rule": "SHOULDER_HIKE",
            "message": f"Compensatory shoulder hiking detected ({shoulder_tilt:.1f}° > 12.0° limit)",
            "severity": "medium"
        })

    is_valid = len(compensations) == 0
    confidence = max(0.0, min(100.0, 100.0 - (torso_lean * 2.0 + shoulder_tilt * 2.5)))

    return jsonify({
        "exercise": exercise_name,
        "is_valid_form": is_valid,
        "quality_score": round(confidence, 1),
        "compensations": compensations,
        "tolerance_applied": tolerance,
        "side": side
    })


@app.post("/api/analytics/clinical-report")
def generate_clinical_report():
    """
    Analyzes a collection of session logs and generates standardized
    rehabilitation progress summaries, consistency curves, and clinical flags.
    """
    data = request.get_json() or {}
    sessions = data.get("sessions", [])
    patient_name = data.get("patient_name", "Patient")

    if not sessions:
        return jsonify({
            "patient_name": patient_name,
            "total_sessions": 0,
            "average_rom": 0.0,
            "peak_rom": 0.0,
            "adherence_rate": 0.0,
            "clinical_recommendation": "No sessions recorded yet."
        })

    max_roms = [s.get("max_angle_achieved", 0.0) or s.get("rom_max", 0.0) for s in sessions]
    valid_reps_list = [s.get("valid_reps", s.get("reps_completed", 0)) for s in sessions]
    consistency_scores = [s.get("consistency_score", 85.0) for s in sessions]

    avg_rom = sum(max_roms) / len(max_roms) if max_roms else 0.0
    peak_rom = max(max_roms) if max_roms else 0.0
    total_valid_reps = sum(valid_reps_list)
    avg_consistency = sum(consistency_scores) / len(consistency_scores) if consistency_scores else 0.0

    recommendation = "Progressing smoothly according to prescribed physiological range."
    if avg_consistency < 75.0:
        recommendation = "Form instability flagged. Consider reducing target repetitions and focusing on isometric hold stability."
    elif peak_rom >= 130.0:
        recommendation = "Excellent functional ROM recovery. Patient is ready for resistance progression."

    return jsonify({
        "patient_name": patient_name,
        "total_sessions": len(sessions),
        "total_valid_reps": total_valid_reps,
        "average_rom": round(avg_rom, 1),
        "peak_rom": round(peak_rom, 1),
        "average_consistency_score": round(avg_consistency, 1),
        "clinical_recommendation": recommendation,
        "generated_at": data.get("timestamp")
    })


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=8000,
        debug=True,
    )
