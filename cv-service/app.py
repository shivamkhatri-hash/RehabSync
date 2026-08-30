from pathlib import Path

from flask import (
    Flask,
    jsonify,
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


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=8000,
        debug=True,
    )
