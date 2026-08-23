# RehabSync Computer Vision Service

This directory contains the standalone Python computer-vision module for
RehabSync. It detects body landmarks, stabilizes tracking, calculates
exercise-specific movement metrics, counts repetitions or timed holds, creates
prototype form feedback, and provides a local webcam/debugging application.

The CV module is intentionally separate from the existing React frontend and
Node/Express/MongoDB backend. It currently runs as a local Python prototype;
real-time React frame transport has not been implemented yet.

> Safety note: all thresholds, form checks, ROM targets, and form scores are
> configurable engineering defaults for a student prototype. They are not
> clinically validated and are not a replacement for physiotherapist advice.

---

## 1. System boundary

```text
React frontend (existing, not modified by this module)
        |
        | future WebSocket or throttled frame transport
        v
Python CV service (this directory)
        |
        | structured numerical result
        v
React UI
        |
        | completed session data
        v
Node / Express / MongoDB (existing, separate)
```

Current development flow:

```text
physical webcam
    |
    v
cv-service/test.py
    |
    +--> raw, unmirrored frame --> MediaPipe Tasks PoseLandmarker
    |                                  |
    |                                  v
    |                              33 landmarks
    |                                  |
    |                                  v
    |                              PoseEngine
    |                                  |
    |                                  v
    |                         exercise analyzer
    |                                  |
    |                                  v
    |                         standardized result
    |
    +--> mirrored preview + readable text
    `--> optional stick-figure debug window
```

MediaPipe always receives the original, unmirrored frame. Only the display is
mirrored. Skeleton X coordinates are transformed for the mirrored display, and
text is drawn afterward so it remains readable.

---

## 2. Directory structure

```text
cv-service/
|-- app.py                         Flask metadata API
|-- pose_engine.py                 MediaPipe and shared tracking engine
|-- test.py                        Local webcam runner and debug CLI
|-- test_pose_engine.py            Automated unit/regression tests
|-- requirements.txt               Python dependencies
|-- README.md                      This technical handoff
|
|-- geometry/
|   |-- __init__.py
|   `-- angles.py                  2D joint angle and EMA utilities
|
`-- exercises/
    |-- __init__.py
    |-- registry.py                Configurations, aliases, camera guidance
    `-- analyzers/
        |-- __init__.py
        |-- base.py                ROM, scoring, telemetry, rep hysteresis
        |-- factory.py             Analyzer-name to class mapping
        |-- joint_angle.py         Arm/knee/shoulder/push-up analyzers
        |-- lower_limb.py          SLR, hip, and calf analyzers
        `-- functional.py          Bilateral, marching, balance, Bird Dog
```

The MediaPipe model is outside this directory by design:

```text
rehab-ai-platform-main/models/pose_landmarker_lite.task
```

Do not create another model copy under `cv-service/`.

---

## 3. Technical architecture

### PoseEngine responsibilities

`pose_engine.py` owns functionality shared by every exercise:

- MediaPipe Tasks `PoseLandmarker` initialization in VIDEO mode
- BGR-to-RGB conversion and frame inference
- anatomical left/right landmark handling
- tolerant visibility and presence scoring
- unilateral side selection and timed side locking
- bilateral tracking paths for exercises that require both sides
- coordinate-level EMA smoothing
- implausible one-frame landmark-jump rejection
- stable, recovering, occluded, and lost tracking states
- stable-frame recovery before analyzer updates resume
- cancellation of incomplete reps after sustained tracking loss
- common result envelope
- mirrored camera drawing and stick-figure debugging

The engine uses only the MediaPipe Tasks API:

```python
mp.tasks.vision.PoseLandmarker
mp.tasks.vision.PoseLandmarkerOptions
mp.tasks.vision.RunningMode.VIDEO
mp.tasks.BaseOptions
```

Do not introduce `mp.solutions` code; that API is not available in the tested
environment.

### ExerciseAnalyzer responsibilities

Each analyzer receives stabilized landmarks only while tracking is stable. An
analyzer owns:

- its primary angle or movement metric
- raw and EMA-smoothed metric values
- direction-aware normalized ROM
- movement phase
- stable-frame threshold confirmation
- cooldown and minimum-excursion rep validation
- exercise-specific secondary constraints
- repetition, cadence, or hold state
- feedback text and prototype form score
- min/max session metric telemetry

Analyzer construction is centralized in
`exercises/analyzers/factory.py`. The registry stores an analyzer key rather
than importing analyzer classes directly, which avoids circular imports.

### Frame processing sequence

```text
1. Read original webcam frame
2. Convert BGR to RGB
3. Run MediaPipe PoseLandmarker
4. Smooth landmark coordinates
5. Reject implausible coordinate jumps
6. Select/retain anatomical side, or validate bilateral landmarks
7. Evaluate visibility and screen bounds
8. Wait for stable recovery frames if tracking was interrupted
9. Run the selected exercise analyzer
10. Return standardized telemetry
11. Mirror the original frame for display
12. Mirror skeleton X coordinates and draw readable text
```

Rep state never advances during `recovering`, `occluded`, or `lost` tracking.

---

## 4. Tracking states and false-rep protection

The shared engine exposes four tracking states:

| State | Meaning | Rep behavior |
|---|---|---|
| `stable` | Required landmarks have remained reliable | Analyzer updates normally |
| `recovering` | Pose returned but has not passed enough stable frames | Rep state frozen |
| `occluded` | Short visibility loss or rejected jump | Rep state frozen |
| `lost` | Loss exceeded configured grace frames | Incomplete movement cancelled |

False repetitions are reduced through several independent safeguards:

- raw landmarks are smoothed before metrics are calculated
- large one-frame coordinate jumps are rejected
- target/rest thresholds must persist for multiple frames
- target and rest have different normalized-ROM regions (hysteresis)
- a full rest-to-target-to-rest cycle is required
- minimum metric excursion is required
- repetition cooldown is applied
- no analyzer updates occur during tracking uncertainty
- unilateral side switching is blocked during an active repetition

Leg exercises use longer recovery and/or tighter jump settings where needed.

---

## 5. Registry configuration

`exercises/registry.py` is the source of truth for exercise names, aliases,
landmarks, thresholds, and camera guidance.

Important `ExerciseConfig` fields:

| Field | Purpose |
|---|---|
| `key` | Stable normalized exercise identifier |
| `name` | Human-readable display name |
| `analyzer` | Key resolved by the analyzer factory |
| `landmark_sets` | Left/right sets or one combined bilateral set |
| `rest_value` | Default metric at rest/start |
| `target_value` | Default comfortable target metric |
| `target_direction` | `increase` or `decrease` |
| `visibility_threshold` | Required average confidence |
| `transition_frames` | Consecutive frames needed for phase confirmation |
| `recovery_frames` | Stable frames required after interruption |
| `lost_grace_frames` | Temporary-loss tolerance |
| `landmark_jump_threshold` | Maximum accepted normalized frame jump |
| `rep_cooldown` | Minimum seconds between accepted reps |
| `min_rep_range` | Minimum raw metric excursion for a valid rep |
| `bilateral` | Whether both anatomical sides are required |
| `secondary_threshold` | Optional analyzer-specific form threshold |
| `camera_guidance` | Exercise setup guidance printed by the CLI |
| `aliases` | Alternative human/legacy names |

### Direction-aware ROM

Normalized ROM is calculated from registry defaults:

```text
normalized_rom = (current - rest) / (target - rest)
```

The value is clamped to `0.0-1.0`. Because the denominator may be positive or
negative, the same formula supports movements toward either larger or smaller
angles.

```text
0.0 = configured rest/start
1.0 = configured target reach
```

Targets are easy to override later for patient-specific calibration.

---

## 6. Standard result contract

PoseEngine returns a consistent dictionary. Example:

```json
{
  "exercise": "Seated Knee Extension",
  "pose_detected": true,
  "side": "left",
  "reps": 5,
  "phase": "target",
  "angle": 158.4,
  "value": 158.421,
  "raw_metric": 160.012,
  "smoothed_metric": 158.421,
  "normalized_rom": 0.971,
  "form_ok": true,
  "form_score": 96,
  "confidence": 0.94,
  "feedback": "Good knee extension. Return with control.",
  "min_angle": 101.2,
  "max_angle": 161.0,
  "min_value": 101.203,
  "max_value": 161.004,
  "hold_seconds": 0.0,
  "duration_seconds": 34.6,
  "tracking_state": "stable",
  "active_constraints": []
}
```

Fields that do not apply are `null` or zero. Calf Raise, balance, and Bird Dog
primarily use ratios or distances, so their `angle` may be `null`.

The form score is a 0-100 prototype composed from tracking confidence,
normalized ROM, and available form constraints. It is not a clinical score.

---

## 7. Supported exercise library

### Core rehabilitation exercises

| Exercise | Analyzer | Main metric / behavior | Recommended view |
|---|---|---|---|
| Seated Knee Extension | `KneeExtensionAnalyzer` | hip-knee-ankle extension angle | Side-front 30-45 degrees |
| Straight Leg Raise | `StraightLegRaiseAnalyzer` | hip flexion with knee-straightness check | Side view |
| Mini Squat | `MiniSquatAnalyzer` | average bilateral knee angle and torso stability | Slight front angle |
| Sit-to-Stand | `SitToStandAnalyzer` | bilateral knee extension and full return | Side-front with chair visible |
| Standing Knee Flexion | `KneeFlexionAnalyzer` | knee flexion and controlled return | Side view |
| Standing Hip Abduction | `HipAbductionAnalyzer` | lateral ankle displacement / leg length | Front view |
| Standing Hip Flexion | `HipFlexionAnalyzer` | shoulder-hip-knee angle | Side view |
| Shoulder Flexion | `ShoulderFlexionAnalyzer` | forward arm elevation and trunk check | Side view |
| Shoulder Abduction | `ShoulderAbductionAnalyzer` | lateral arm elevation and trunk check | Front view |
| Bicep Curl / Elbow Flexion | `ElbowFlexionAnalyzer` | shoulder-elbow-wrist angle and elbow drift | Front-side view |
| Wall Slides | `WallSlideAnalyzer` | bilateral shoulder elevation and symmetry | Front view |
| Calf Raise | `CalfRaiseAnalyzer` | heel-to-toe rise / knee-ankle length | Side view including feet |
| Marching in Place | `MarchingAnalyzer` | alternating hip angles, steps, cadence | Slight front angle |
| Single-Leg Balance | `BalanceAnalyzer` | foot clearance, hold time, hip sway | Full-body front view |
| Bird Dog | `BirdDogAnalyzer` | opposite arm-leg extension and hip tilt | Side-front view |

### Secondary/general exercises

- Push-up
- Squat
- Lunge
- Crunch

### Important aliases

```text
Elbow Flexion       -> Bicep Curl
Knee Extension      -> Seated Knee Extension
Leg Raise           -> Straight Leg Raise
Shoulder Raise      -> Shoulder Flexion
Standing Calf Raise -> Calf Raise
```

Names accept spaces, underscores, and hyphens where appropriate.

---

## 8. Environment and installation

Confirmed development environment:

```text
Windows
Python 3.11.9
MediaPipe 1.0.1
OpenCV 5.0.0
NumPy 2.4.6
```

From the project root, activate the existing environment:

```powershell
.\venv\Scripts\Activate.ps1
```

If PowerShell script execution blocks activation, run the environment Python
directly instead:

```powershell
.\venv\Scripts\python.exe --version
```

Install CV dependencies when setting up a new environment:

```powershell
python -m pip install -r cv-service\requirements.txt
```

---

## 9. Webcam commands

Run these from `cv-service/` after activating the environment:

```powershell
python test.py --exercise "Seated Knee Extension"
python test.py --exercise "Straight Leg Raise"
python test.py --exercise "Mini Squat"
python test.py --exercise "Sit-to-Stand"
python test.py --exercise "Standing Knee Flexion"
python test.py --exercise "Standing Hip Abduction"
python test.py --exercise "Standing Hip Flexion"
python test.py --exercise "Shoulder Flexion"
python test.py --exercise "Shoulder Abduction"
python test.py --exercise "Bicep Curl"
python test.py --exercise "Wall Slides"
python test.py --exercise "Calf Raise"
python test.py --exercise "Marching in Place"
python test.py --exercise "Single-Leg Balance"
python test.py --exercise "Bird Dog"
```

Normalized names also work:

```powershell
python test.py --exercise seated_knee_extension
python test.py --exercise straight_leg_raise
python test.py --exercise mini_squat
python test.py --exercise sit_to_stand
python test.py --exercise standing_knee_flexion
python test.py --exercise standing_hip_abduction
python test.py --exercise standing_hip_flexion
python test.py --exercise shoulder_flexion
python test.py --exercise shoulder_abduction
python test.py --exercise bicep_curl
python test.py --exercise wall_slides
python test.py --exercise calf_raise
python test.py --exercise marching_in_place
python test.py --exercise single_leg_balance
python test.py --exercise bird_dog
```

Use a different camera:

```powershell
python test.py --exercise "Mini Squat" --camera 1
```

Show CLI help:

```powershell
python test.py --help
```

### Debug mode

Normal mode keeps the display clean. Debug mode opens the separate stick-figure
window and prints live analyzer telemetry every 15 frames:

```powershell
python test.py --exercise "Straight Leg Raise" --debug
```

Debug data includes:

- selected or active side
- raw metric
- smoothed metric
- confidence
- tracking state
- phase
- reps
- normalized ROM
- form score
- hold duration
- active form constraints

### Keyboard controls

The OpenCV window must be focused.

| Key | Action |
|---|---|
| `Q` | Quit webcam testing |
| `R` | Reset reps/hold, analyzer state, tracking state, and trails |

---

## 10. Flask metadata API

The Flask application exposes health and exercise configuration. It does not
yet receive live frames.

From `cv-service/`:

```powershell
python app.py
```

Endpoints:

```text
GET http://localhost:8000/
GET http://localhost:8000/api/exercises
GET http://localhost:8000/api/exercises/Seated%20Knee%20Extension
```

Example PowerShell request:

```powershell
Invoke-RestMethod http://localhost:8000/api/exercises/Seated%20Knee%20Extension
```

The response includes analyzer name, landmarks, ROM direction, thresholds,
bilateral mode, and camera guidance.

---

## 11. Testing and validation commands

Run from the project root:

```powershell
.\venv\Scripts\python.exe -m unittest discover -s cv-service -p "test*.py" -v
```

Compile every Python file without opening the webcam:

```powershell
$pythonFiles = Get-ChildItem -LiteralPath cv-service -Recurse -Filter *.py | ForEach-Object FullName
.\venv\Scripts\python.exe -m py_compile $pythonFiles
```

Import-check the package and list analyzer mappings:

```powershell
.\venv\Scripts\python.exe -c "import sys; sys.path.insert(0, 'cv-service'); from exercises import list_exercises; from exercises.analyzers import create_analyzer; print([(x.name, type(create_analyzer(x)).__name__) for x in list_exercises()])"
```

Verify no obsolete MediaPipe API was introduced:

```powershell
rg -n "mp\.solutions|mediapipe\.solutions" cv-service
```

Verify the model exists:

```powershell
Get-Item .\models\pose_landmarker_lite.task
```

Tests currently cover:

- angle calculation
- exercise normalization and aliases
- registry loading
- analyzer factory selection
- common result fields
- threshold-frame debouncing
- false duplicate-rep prevention
- tracking loss and stable recovery
- landmark jump rejection
- stick-figure rendering

---

## 12. Adding or modifying an exercise

Use this sequence to preserve architecture:

1. Decide whether an existing analyzer already models the movement.
2. Prefer an alias/configuration when the movement logic is equivalent.
3. Add a new analyzer only when the primary metric or state machine differs.
4. Register the analyzer class in `analyzers/factory.py`.
5. Add `ExerciseConfig` in `exercises/registry.py`.
6. Add aliases and camera guidance.
7. Ensure left and right landmark sets are anatomical MediaPipe sides.
8. Use a combined landmark set and `bilateral=True` when both sides matter.
9. Add an analyzer-selection/common-result test.
10. Compile, import-check, and run the full tests before webcam calibration.

Do not add large exercise-specific `if` blocks back into `PoseEngine`.

### Analyzer contract

A standard analyzer implements or inherits:

```python
measure(landmarks, side, landmark_set)
form_check(landmarks, side, landmark_set, metric)
process(landmarks, side, landmark_set, confidence, timestamp_s)
reset()
tracking_lost()
```

Special state machines such as marching, balance, or Bird Dog may override
`process`, but they must return the common result shape.

---

## 13. Calibration priorities and known limitations

Every exercise requires real webcam validation. Prioritize:

1. Sit-to-Stand across different chair heights and partial stands
2. Standing Hip Abduction across front-camera distances
3. Shoulder Flexion versus Abduction camera-plane separation
4. Wall Slide bilateral symmetry with arm occlusion
5. Calf Raise heel-lift ratios across camera heights
6. Marching alternation and cadence at different speeds
7. Single-Leg Balance sway and foot-clearance tolerance
8. Bird Dog diagonal extension and limb occlusion

Other limitations:

- calculations primarily use 2D normalized image coordinates
- monocular depth makes movement-plane classification approximate
- loose clothing, poor contrast, low light, and cropped feet reduce confidence
- one-frame jumps are held, but sustained relocation requires tracking recovery
- form checks are deliberately understandable heuristics, not diagnoses
- no patient-specific calibration UI exists yet
- no recorded-video regression dataset exists yet
- Flask does not yet manage per-user real-time analyzer sessions

---

## 14. AI-agent technical handoff

Future AI agents must read the project-level `AGENTS.md` completely before
editing. The repository is the source of truth.

### Required scope rules

- Keep changes inside `cv-service/` unless the user explicitly authorizes more.
- Keep Python CV separate from React and Node/Express.
- Use MediaPipe Tasks; never introduce `mp.solutions`.
- Send unmirrored frames to MediaPipe.
- Mirror display only and keep overlay text readable.
- Preserve anatomical left/right internally.
- Preserve bilateral support and tracking-loss safeguards.
- Do not describe thresholds or scores as clinically validated.
- Prefer analyzer modules and registry aliases over engine conditionals.
- Do not duplicate the `.task` model.

### AI-agent inspection commands

Run from the project root:

```powershell
Get-Content -LiteralPath .\AGENTS.md -Raw
rg --files cv-service models
Get-Content -LiteralPath .\cv-service\README.md -Raw
Get-Content -LiteralPath .\cv-service\pose_engine.py -Raw
Get-Content -LiteralPath .\cv-service\exercises\registry.py -Raw
Get-ChildItem -LiteralPath .\cv-service\exercises\analyzers -Filter *.py | Select-Object Name
rg -n "class .*Analyzer|def process|def measure|def form_check" cv-service\exercises\analyzers
rg -n "mp\.solutions|mediapipe\.solutions" cv-service
```

### AI-agent verification commands

```powershell
$pythonFiles = Get-ChildItem -LiteralPath cv-service -Recurse -Filter *.py | ForEach-Object FullName
.\venv\Scripts\python.exe -m py_compile $pythonFiles
.\venv\Scripts\python.exe -m unittest discover -s cv-service -p "test*.py" -v
.\venv\Scripts\python.exe cv-service\test.py --help
Get-Item -LiteralPath .\models\pose_landmarker_lite.task
```

### Suggested context prompt for another AI agent

```text
Read AGENTS.md and cv-service/README.md completely. Inspect pose_engine.py,
the exercise registry, every analyzer, test.py, app.py, and the CV tests.
Keep changes inside cv-service. Preserve MediaPipe Tasks, unmirrored inference,
anatomical side handling, tracking-loss safeguards, analyzer modularity, and
the standard result contract. Run compile/import checks and all CV tests after
editing. Treat current repository code as the source of truth.
```

---

## 15. Current verified status

At the time of this handoff:

- 15 core rehabilitation exercises resolve through the registry
- 4 secondary/general exercises remain available
- all registry entries resolve to analyzer classes
- standardized analyzer-result tests pass
- MediaPipe model loading and blank-frame inference have been verified
- Python compile/import checks pass
- no `mp.solutions` references exist in the CV module
- React and Node integration remains intentionally unchanged

Use the automated checks above after every architecture or threshold change.
