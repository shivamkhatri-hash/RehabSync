from pathlib import Path
import argparse

import cv2

from exercises import (
    get_exercise,
    get_exercise_names,
)

from pose_engine import (
    PoseEngine,
    SkeletonDebugger,
    draw_result,
)


def main():

    parser = argparse.ArgumentParser(
        description=
            "RehabSync CV Tester"
    )

    parser.add_argument(

        "--exercise",

        default="Bicep Curl",

        help="Exercise name",
    )

    parser.add_argument(

        "--camera",

        type=int,

        default=0,

        help="Camera index",
    )

    parser.add_argument(
        "--debug",
        action="store_true",
        help="Show the stick-figure debugger and print live analyzer values",
    )

    args = parser.parse_args()

    exercise = get_exercise(
        args.exercise
    )

    project_root = (

        Path(__file__)
        .resolve()
        .parent
        .parent
    )

    model_path = (

        project_root
        /
        "models"
        /
        "pose_landmarker_lite.task"
    )

    print("=" * 60)

    print(
        "RehabSync Computer Vision Test"
    )

    print("=" * 60)

    print(
        "Exercise:",
        exercise.name,
    )

    print(
        "Available:",
        ", ".join(
            get_exercise_names()
        ),
    )

    print(
        "Model:",
        model_path,
    )

    print("Camera guidance:", exercise.camera_guidance)

    engine = PoseEngine(

        model_path=
            str(model_path),

        exercise=
            exercise,
    )

    skeleton_debugger = SkeletonDebugger()

    camera = cv2.VideoCapture(
        args.camera
    )

    if not camera.isOpened():

        engine.close()

        raise RuntimeError(
            "Could not open camera."
        )

    camera.set(
        cv2.CAP_PROP_FRAME_WIDTH,
        640,
    )

    camera.set(
        cv2.CAP_PROP_FRAME_HEIGHT,
        480,
    )

    print(
        "Camera started."
    )

    print(
        "Q = quit"
    )

    print(
        "R = reset reps"
    )

    timestamp_ms = 0
    frame_number = 0

    try:

        while True:

            success, frame = (
                camera.read()
            )

            if not success:

                print(
                    "Could not read camera frame."
                )

                break

            # =================================================
            # CV USES ORIGINAL FRAME
            # =================================================
            #
            # This preserves correct anatomical
            # left / right detection.
            # =================================================

            timestamp_ms += 33
            frame_number += 1

            result = (
                engine.process_frame(

                    frame,

                    timestamp_ms,
                )
            )

            # =================================================
            # USER PREVIEW IS MIRRORED
            # =================================================

            display_frame = (
                cv2.flip(
                    frame,
                    1,
                )
            )

            # =================================================
            # DRAW AFTER MIRROR
            # =================================================
            #
            # Text remains normal.
            #
            # Skeleton coordinates are mirrored by
            # draw_result().
            # =================================================

            display_frame = (
                draw_result(

                    display_frame,

                    result,

                    mirrored=True,
                )
            )

            cv2.imshow(

                "RehabSync CV",

                display_frame,
            )

            if args.debug:
                skeleton_frame = skeleton_debugger.render(
                    result,
                    width=640,
                    height=480,
                    mirrored=True,
                )

                cv2.imshow(
                    "RehabSync Joint Movement Debugger",
                    skeleton_frame,
                )

                if frame_number % 15 == 0:
                    print(
                        "DEBUG",
                        f"side={result.get('side')}",
                        f"raw={result.get('raw_metric')}",
                        f"smooth={result.get('smoothed_metric')}",
                        f"confidence={result.get('confidence')}",
                        f"phase={result.get('phase')}",
                        f"reps={result.get('reps')}",
                        f"rom={result.get('normalized_rom')}",
                        f"constraints={result.get('active_constraints')}",
                    )

            key = (

                cv2.waitKey(1)

                & 0xFF
            )

            if key == ord("q"):

                break

            elif key == ord("r"):

                engine.reset()
                skeleton_debugger.reset()

                print(
                    "Repetitions reset."
                )

    finally:

        final_reps = (
            engine.reps
        )

        camera.release()

        cv2.destroyAllWindows()

        engine.close()

        print(
            "Final reps:",
            final_reps,
        )

        print(
            "CV test finished."
        )


if __name__ == "__main__":

    main()
