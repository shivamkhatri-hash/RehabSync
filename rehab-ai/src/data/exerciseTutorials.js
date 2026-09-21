/**
 * Exercise Tutorials & Form Demonstration Data (Phase 1)
 * Includes: Starting position, camera placement, step-by-step movement, and common mistakes.
 */

export const EXERCISE_TUTORIALS = {
  'Bicep Curl (Standing)': {
    name: 'Bicep Curl (Standing)',
    category: 'Upper Body',
    targetJoints: 'Elbow Joint & Shoulder (Perpendicular Alignment)',
    targetMuscles: 'Biceps Brachii, Brachialis, Anterior Deltoid',
    difficulty: 'Beginner to Intermediate',
    overview: 'Standing bicep curl with horizontal upper-arm placement (shoulder-to-elbow in a straight line perpendicular to torso) targeting peak biceps activation and shoulder stabilization.',
    startingPosition: {
      posture: 'Stand tall with feet shoulder-width apart, chest upright, core engaged, and spine neutral.',
      jointSetup: 'Raise your upper arm so the shoulder-to-elbow line is strictly horizontal (at a 90° angle perpendicular to your torso). Forearm is extended forward.',
      cues: [
        'Anchor feet firmly on the ground.',
        'Elevate upper arm to horizontal level (parallel with floor, perpendicular to body).',
        'Keep shoulder and elbow locked in this horizontal axis throughout the movement.'
      ]
    },
    cameraPlacement: {
      view: 'Front View (or slight 45° angle)',
      distance: '6 - 8 ft (1.8 - 2.4 m) away',
      height: 'Chest / Shoulder height',
      guidelines: [
        'Ensure both shoulders, elbows, and wrists are fully visible within the camera boundary.',
        'Maintain good room lighting facing towards you (avoid strong backlighting behind you).'
      ]
    },
    movementPhases: [
      {
        phase: 'Phase 1: Starting Setup',
        angle: '150° - 160° (Extended Forearm)',
        instruction: 'Hold the upper arm horizontally at shoulder level. Extend your forearm forward with palms facing upwards.'
      },
      {
        phase: 'Phase 2: Peak Contraction',
        angle: '80° - 85° (Flexed Forearm)',
        instruction: 'Flex your elbow upward towards your shoulder without dropping your upper arm. Squeeze the bicep at the top for 1 second.'
      },
      {
        phase: 'Phase 3: Controlled Return',
        angle: '150° - 160° (Extended Forearm)',
        instruction: 'Slowly lower the forearm back to the horizontal starting position with steady, smooth control (2 seconds).'
      }
    ],
    commonMistakes: [
      {
        mistake: 'Dropping the Elbow Below Shoulder Level',
        consequence: 'Loses horizontal alignment and reduces target peak tension on the bicep.',
        correction: 'Keep the elbow elevated in a strict horizontal line with your shoulder throughout every repetition.'
      },
      {
        mistake: 'Using Torso Swing / Momentum',
        consequence: 'Shifts load to lumbar spine and reduces neuromuscular rehab efficacy.',
        correction: 'Engage abdominals and glutes to keep the torso completely still.'
      },
      {
        mistake: 'Incomplete Range of Motion',
        consequence: 'Shortens muscle recruitment and does not register reps in AI tracker.',
        correction: 'Ensure you flex past the 85° threshold and fully return past 150° on each repetition.'
      }
    ],
    animKey: 'bicep_curl_horizontal'
  },

  'Bicep Curl': {
    name: 'Bicep Curl',
    category: 'Upper Body',
    targetJoints: 'Elbow Joint & Shoulder (Perpendicular Alignment)',
    targetMuscles: 'Biceps Brachii, Brachialis',
    difficulty: 'Beginner',
    overview: 'Clinical arm flexion training emphasizing horizontal arm placement and smooth concentric/eccentric tempo.',
    startingPosition: {
      posture: 'Stand or sit upright with a neutral spine and relaxed neck.',
      jointSetup: 'Elevate upper arm horizontally perpendicular to torso at 90 degrees.',
      cues: [
        'Maintain level shoulders.',
        'Keep upper arm fixed horizontally in space.'
      ]
    },
    cameraPlacement: {
      view: 'Front View',
      distance: '6 - 8 ft (1.8 - 2.4 m)',
      height: 'Chest height',
      guidelines: [
        'Keep upper body clearly centered in the camera feed.'
      ]
    },
    movementPhases: [
      {
        phase: 'Phase 1: Starting Extension',
        angle: '150°+',
        instruction: 'Forearm extended forward horizontally.'
      },
      {
        phase: 'Phase 2: Flexion Peak',
        angle: '85° or less',
        instruction: 'Curl forearm towards the head while keeping the upper arm horizontally stationary.'
      },
      {
        phase: 'Phase 3: Controlled Extension',
        angle: '150°+',
        instruction: 'Return forearm to starting position smoothly.'
      }
    ],
    commonMistakes: [
      {
        mistake: 'Sagging Upper Arm',
        consequence: 'Breaks the horizontal joint vector needed for clinical calibration.',
        correction: 'Focus on holding the elbow at shoulder height continuously.'
      },
      {
        mistake: 'Jerky / Rapid Movement',
        consequence: 'Misses joint angle capture in vision frames.',
        correction: 'Perform each rep with a steady 2-second lift and 2-second lowering cadence.'
      }
    ],
    animKey: 'bicep_curl_horizontal'
  },

  'Push-up': {
    name: 'Push-up',
    category: 'Upper Body & Core',
    targetJoints: 'Elbows, Shoulders, Spine & Core',
    targetMuscles: 'Pectoralis Major, Anterior Deltoid, Triceps, Core',
    difficulty: 'Intermediate',
    overview: 'Full-body horizontal pushing movement targeting chest strength, shoulder stability, and core rigidity.',
    startingPosition: {
      posture: 'High plank position with hands slightly wider than shoulder-width, fingers pointing forward.',
      jointSetup: 'Arms straight (elbows ~160°), body forming a straight rigid line from heels to head.',
      cues: [
        'Squeeze glutes and brace your core.',
        'Keep neck neutral (gaze at floor ~1 ft ahead of hands).'
      ]
    },
    cameraPlacement: {
      view: 'Side Profile (90° view)',
      distance: '7 - 9 ft (2.1 - 2.7 m)',
      height: 'Knee to floor height',
      guidelines: [
        'Ensure head, hips, and heels are in full view of the camera.'
      ]
    },
    movementPhases: [
      {
        phase: 'Phase 1: High Plank',
        angle: '155°+ (Elbows)',
        instruction: 'Hold rigid plank with arms fully supporting body weight.'
      },
      {
        phase: 'Phase 2: Lowering (Eccentric)',
        angle: '90° - 105° (Elbows)',
        instruction: 'Lower chest towards floor until elbows bend to 90°.'
      },
      {
        phase: 'Phase 3: Pressing (Concentric)',
        angle: '155°+ (Elbows)',
        instruction: 'Drive through palms to return to full high plank.'
      }
    ],
    commonMistakes: [
      {
        mistake: 'Sagging Lower Back (Hip Dip)',
        consequence: 'Places shear stress on lumbar vertebrae.',
        correction: 'Tuck pelvis slightly under and brace abs tight throughout.'
      },
      {
        mistake: 'Flaring Elbows out at 90° to Torso',
        consequence: 'Causes shoulder impingement.',
        correction: 'Keep elbows tucked at roughly 45° angle relative to your ribs.'
      }
    ],
    animKey: 'pushup'
  },

  'Crunch': {
    name: 'Crunch',
    category: 'Core',
    targetJoints: 'Thoracic & Lumbar Spine',
    targetMuscles: 'Rectus Abdominis, Transverse Abdominis',
    difficulty: 'Beginner',
    overview: 'Supine abdominal flexion strengthening the core while protecting the lower back.',
    startingPosition: {
      posture: 'Lie on your back on a mat, knees bent at 90°, feet flat on floor hip-width apart.',
      jointSetup: 'Hands placed lightly behind head or crossed over chest. Lower back neutral.',
      cues: [
        'Do not yank or pull on your head/neck.',
        'Anchor your lower back gently toward the mat.'
      ]
    },
    cameraPlacement: {
      view: 'Side Profile',
      distance: '6 - 8 ft (1.8 - 2.4 m)',
      height: 'Floor / Low mat height',
      guidelines: [
        'Place camera sideways so your head, torso, hips, and knees are clearly seen.'
      ]
    },
    movementPhases: [
      {
        phase: 'Phase 1: Supine Rest',
        angle: '115°+ (Trunk angle)',
        instruction: 'Shoulders flat on mat, breathing in.'
      },
      {
        phase: 'Phase 2: Abdominal Lift',
        angle: '80° (Trunk angle)',
        instruction: 'Exhale and peel your shoulder blades 3-4 inches off the floor by contracting abs.'
      },
      {
        phase: 'Phase 3: Smooth Lowering',
        angle: '115°+ (Trunk angle)',
        instruction: 'Lower shoulders back down with control without releasing core tension.'
      }
    ],
    commonMistakes: [
      {
        mistake: 'Pulling on Neck with Hands',
        consequence: 'Cervical spine strain and reduced abdominal recruitment.',
        correction: 'Keep chin tucked as if holding a tennis ball between chin and collarbone.'
      }
    ],
    animKey: 'crunch'
  },

  'Seated Knee Extension': {
    name: 'Seated Knee Extension',
    category: 'Lower Body',
    targetJoints: 'Knee Joint (Tibiofemoral)',
    targetMuscles: 'Quadriceps (Rectus Femoris, Vastus Medialis/Lateralis)',
    difficulty: 'Beginner',
    overview: 'Open-chain seated knee extension strengthening the quadriceps for patellofemoral rehab and gait stability.',
    startingPosition: {
      posture: 'Sit upright in a sturdy chair with your back supported and thighs resting flat on the seat.',
      jointSetup: 'Knees bent at 90° with feet hanging comfortably off the floor or lightly resting.',
      cues: [
        'Maintain an upright spine without slouching.',
        'Place hands on the chair seat for stability.'
      ]
    },
    cameraPlacement: {
      view: 'Side Profile (90°)',
      distance: '6 - 8 ft (1.8 - 2.4 m)',
      height: 'Seat height (2-3 ft)',
      guidelines: [
        'Position camera to clearly see hip, knee, and ankle joints in profile.'
      ]
    },
    movementPhases: [
      {
        phase: 'Phase 1: 90° Flexed Knee',
        angle: '90° - 105° (Knee)',
        instruction: 'Foot relaxed, knee at 90° angle under the chair.'
      },
      {
        phase: 'Phase 2: Terminal Extension Hold',
        angle: '160° - 180° (Knee)',
        instruction: 'Slowly straighten the knee until the leg is fully straight. Hold for 1-2 seconds.'
      },
      {
        phase: 'Phase 3: Controlled Lowering',
        angle: '90° - 105° (Knee)',
        instruction: 'Gently lower foot back down without letting it slam.'
      }
    ],
    commonMistakes: [
      {
        mistake: 'Swinging / Kicking the Leg Quickly',
        consequence: 'Momentum bypasses quadriceps strength development.',
        correction: 'Extend with smooth 2-second lift, pause at top, and 2-second lowering.'
      },
      {
        mistake: 'Leaning Back in Chair',
        consequence: 'Compensates with hip flexors rather than pure quad extension.',
        correction: 'Keep upper torso upright and steady.'
      }
    ],
    animKey: 'knee_extension'
  },

  'Straight Leg Raise': {
    name: 'Straight Leg Raise',
    category: 'Lower Body & Core',
    targetJoints: 'Hip Joint & Knee Joint',
    targetMuscles: 'Iliopsoas, Rectus Femoris, Quadriceps',
    difficulty: 'Beginner',
    overview: 'Supine hip flexion exercise for active knee extension stability and hip strength without joint loading.',
    startingPosition: {
      posture: 'Lie flat on your back on an exercise mat or firm bed.',
      jointSetup: 'One leg bent with foot flat on floor; target leg extended completely flat on the mat.',
      cues: [
        'Lock the target knee fully straight before lifting.',
        'Point toes upward toward ceiling.'
      ]
    },
    cameraPlacement: {
      view: 'Side Profile',
      distance: '6 - 8 ft (1.8 - 2.4 m)',
      height: 'Floor / Low height',
      guidelines: [
        'Camera must capture the full body from head to toes in side view.'
      ]
    },
    movementPhases: [
      {
        phase: 'Phase 1: Grounded Start',
        angle: '165°+ (Hip angle)',
        instruction: 'Leg flat on mat, quad tightened.'
      },
      {
        phase: 'Phase 2: 45° Leg Elevation',
        angle: '115° - 125° (Hip angle)',
        instruction: 'Raise straight leg up until thigh matches the height of the opposite bent knee.'
      },
      {
        phase: 'Phase 3: Controlled Return',
        angle: '165°+ (Hip angle)',
        instruction: 'Lower leg back down slowly until heel touches mat.'
      }
    ],
    commonMistakes: [
      {
        mistake: 'Bending Knee During Lift',
        consequence: 'Removes quadriceps isometric locking benefit.',
        correction: 'Squeeze the quad tight before lifting and maintain knee lock throughout.'
      }
    ],
    animKey: 'leg_raise'
  },

  'Mini Squat': {
    name: 'Mini Squat',
    category: 'Lower Body',
    targetJoints: 'Knees & Hips',
    targetMuscles: 'Quadriceps, Gluteus Maximus, Hamstrings',
    difficulty: 'Beginner',
    overview: 'Closed-chain functional partial squat strengthening lower extremity stabilizers while minimizing joint stress.',
    startingPosition: {
      posture: 'Stand with feet shoulder-width apart, toes pointing slightly outward (5-10°).',
      jointSetup: 'Hips and knees straight, arms held in front for balance.',
      cues: [
        'Keep weight centered over midfoot and heels.',
        'Keep chest up and shoulders back.'
      ]
    },
    cameraPlacement: {
      view: 'Side Profile or 45° Angle',
      distance: '7 - 9 ft (2.1 - 2.7 m)',
      height: 'Waist height',
      guidelines: [
        'Ensure feet, knees, hips, and shoulders are in frame.'
      ]
    },
    movementPhases: [
      {
        phase: 'Phase 1: Standing Tall',
        angle: '165°+ (Knee angle)',
        instruction: 'Stand upright with core braced.'
      },
      {
        phase: 'Phase 2: Partial Squat Depth',
        angle: '120° - 125° (Knee angle)',
        instruction: 'Hinge hips back and bend knees to roughly 45°-60° flexion (partial squat depth).'
      },
      {
        phase: 'Phase 3: Drive Upwards',
        angle: '165°+ (Knee angle)',
        instruction: 'Push through heels to return to full standing position.'
      }
    ],
    commonMistakes: [
      {
        mistake: 'Knees Collapsing Inward (Valgus)',
        consequence: 'Puts excessive stress on ACL and patella.',
        correction: 'Track knees outward in line with your second and third toes.'
      },
      {
        mistake: 'Heels Lifting Off Floor',
        consequence: 'Shifts load excessively to anterior patellar tendon.',
        correction: 'Keep full foot flat on floor, driving weight through heels.'
      }
    ],
    animKey: 'squat'
  },

  'Sit-to-Stand': {
    name: 'Sit-to-Stand',
    category: 'Lower Body & Functional',
    targetJoints: 'Hips, Knees, Ankles, Core',
    targetMuscles: 'Quadriceps, Glutes, Calves, Core',
    difficulty: 'Beginner to Intermediate',
    overview: 'Essential functional mobility pattern training sit-to-stand independence and lower body kinetic chain power.',
    startingPosition: {
      posture: 'Sit on the front third of a sturdy chair with feet flat on floor, shoulder-width apart.',
      jointSetup: 'Knees bent at 90°, arms crossed over chest (or held out in front for balance).',
      cues: [
        'Lean upper body slightly forward from hips (nose over toes).',
        'Avoid pushing with hands on armrests if building leg strength.'
      ]
    },
    cameraPlacement: {
      view: 'Side Profile (90°)',
      distance: '7 - 9 ft (2.1 - 2.7 m)',
      height: 'Seat to waist height',
      guidelines: [
        'Capture the chair, full body in seated and standing positions.'
      ]
    },
    movementPhases: [
      {
        phase: 'Phase 1: Seated Ready',
        angle: '95° - 105° (Knees)',
        instruction: 'Seated tall with feet placed firmly beneath knees.'
      },
      {
        phase: 'Phase 2: Stand & Extend',
        angle: '160° - 180° (Knees & Hips)',
        instruction: 'Drive through heels to stand fully upright, squeezing glutes at the top.'
      },
      {
        phase: 'Phase 3: Controlled Descent',
        angle: '95° - 105° (Knees)',
        instruction: 'Hinge hips back and slowly lower down until sitting lightly on chair.'
      }
    ],
    commonMistakes: [
      {
        mistake: 'Dropping / Plopping into the Chair',
        consequence: 'Misses vital eccentric quadriceps control.',
        correction: 'Lower yourself under smooth 3-second control until you touch the seat.'
      }
    ],
    animKey: 'sit_to_stand'
  },

  'Standing Knee Flexion': {
    name: 'Standing Knee Flexion',
    category: 'Lower Body',
    targetJoints: 'Knee Joint (Hamstring focus)',
    targetMuscles: 'Hamstrings (Biceps Femoris, Semitendinosus), Gastrocnemius',
    difficulty: 'Beginner',
    overview: 'Standing hamstring curl for active knee flexion range of motion and posterior chain balance.',
    startingPosition: {
      posture: 'Stand tall holding onto a wall, chair, or counter for light balance.',
      jointSetup: 'Standing leg straight; target leg aligned parallel with standing thigh.',
      cues: [
        'Keep thighs parallel to each other.',
        'Do not let the target knee drift forward.'
      ]
    },
    cameraPlacement: {
      view: 'Side Profile (90°)',
      distance: '6 - 8 ft (1.8 - 2.4 m)',
      height: 'Hip height',
      guidelines: [
        'Side view must capture hip, knee, and ankle clearly.'
      ]
    },
    movementPhases: [
      {
        phase: 'Phase 1: Standing Straight',
        angle: '165°+ (Knee angle)',
        instruction: 'Both legs straight and parallel.'
      },
      {
        phase: 'Phase 2: Knee Flexion Curl',
        angle: '90° - 100° (Knee angle)',
        instruction: 'Bend knee backwards, lifting heel towards buttock.'
      },
      {
        phase: 'Phase 3: Return to Floor',
        angle: '165°+ (Knee angle)',
        instruction: 'Lower foot back to floor with steady tempo.'
      }
    ],
    commonMistakes: [
      {
        mistake: 'Thigh Drifting Forward During Flexion',
        consequence: 'Shifts work away from hamstrings to hip flexors.',
        correction: 'Keep the knee pointing straight down at the floor throughout the lift.'
      }
    ],
    animKey: 'standing_knee_flexion'
  },

  'Shoulder Abduction': {
    name: 'Shoulder Abduction',
    category: 'Upper Body',
    targetJoints: 'Glenohumeral Joint & Scapulothoracic',
    targetMuscles: 'Deltoid (Middle), Supraspinatus, Trapezius',
    difficulty: 'Beginner',
    overview: 'Lateral shoulder raise targeting deltoid strength and scapulohumeral rhythm.',
    startingPosition: {
      posture: 'Stand or sit tall with neutral spine and shoulders relaxed away from ears.',
      jointSetup: 'Arm resting at your side with thumb pointing slightly forward or upward.',
      cues: [
        'Keep elbow straight or with a soft 5° unlock.',
        'Avoid shrugging shoulders up toward ears.'
      ]
    },
    cameraPlacement: {
      view: 'Front View',
      distance: '6 - 8 ft (1.8 - 2.4 m)',
      height: 'Chest height',
      guidelines: [
        'Full upper body from head to hips must be visible.'
      ]
    },
    movementPhases: [
      {
        phase: 'Phase 1: Arm at Side',
        angle: '20° or less',
        instruction: 'Arm resting naturally at side.'
      },
      {
        phase: 'Phase 2: 90° Abduction',
        angle: '90° - 95°',
        instruction: 'Raise arm out to the side until parallel with floor (shoulder level).'
      },
      {
        phase: 'Phase 3: Smooth Lowering',
        angle: '20° or less',
        instruction: 'Lower arm back to side with control.'
      }
    ],
    commonMistakes: [
      {
        mistake: 'Shoulder Shrugging / Hiking',
        consequence: 'Over-activates upper trapezius and causes neck tension.',
        correction: 'Keep shoulder blade depressed and pull downward while raising arm.'
      }
    ],
    animKey: 'shoulder_abduction'
  },

  'Shoulder Flexion': {
    name: 'Shoulder Flexion',
    category: 'Upper Body',
    targetJoints: 'Shoulder Joint (Anterior Glenohumeral)',
    targetMuscles: 'Anterior Deltoid, Coracobrachialis, Pectoralis Major (Clavicular)',
    difficulty: 'Beginner',
    overview: 'Sagittal plane arm elevation to restore overhead range of motion and anterior shoulder strength.',
    startingPosition: {
      posture: 'Stand tall with feet hip-width apart and core engaged.',
      jointSetup: 'Arm straight at side, thumb pointing forward.',
      cues: ['Keep spine neutral without arching lower back.', 'Elbow straight.']
    },
    cameraPlacement: {
      view: 'Side Profile (90°)',
      distance: '6 - 8 ft (1.8 - 2.4 m)',
      height: 'Chest height',
      guidelines: ['Side view capturing shoulder, elbow, wrist, and torso.']
    },
    movementPhases: [
      {
        phase: 'Phase 1: Neutral Hang',
        angle: '15° - 20°',
        instruction: 'Arm hanging straight down alongside thigh.'
      },
      {
        phase: 'Phase 2: Forward Arm Elevation',
        angle: '90° - 105°',
        instruction: 'Raise straight arm forward and upward to shoulder height or above.'
      },
      {
        phase: 'Phase 3: Controlled Descent',
        angle: '15° - 20°',
        instruction: 'Lower arm smoothly back down to starting position.'
      }
    ],
    commonMistakes: [
      {
        mistake: 'Arching the Lower Back',
        consequence: 'Compensates for tight lats by stressing lumbar spine.',
        correction: 'Brace abdominals and keep ribcage down as the arm elevates.'
      }
    ],
    animKey: 'shoulder_flexion'
  },

  'Standing Hip Abduction': {
    name: 'Standing Hip Abduction',
    category: 'Lower Body',
    targetJoints: 'Hip Joint (Coxofemoral)',
    targetMuscles: 'Gluteus Medius, Gluteus Minimus, Tensor Fasciae Latae',
    difficulty: 'Beginner',
    overview: 'Lateral leg lift to activate lateral hip stabilizers critical for pelvic levelness and knee alignment.',
    startingPosition: {
      posture: 'Stand tall holding lightly onto a stable chair or counter for balance.',
      jointSetup: 'Standing leg grounded; active leg straight with toes pointing forward.',
      cues: ['Do not rotate foot outward; keep toes facing forward.', 'Keep torso vertical.']
    },
    cameraPlacement: {
      view: 'Front View',
      distance: '6 - 8 ft (1.8 - 2.4 m)',
      height: 'Waist height',
      guidelines: ['Capture both hips, legs, and feet in frontal frame.']
    },
    movementPhases: [
      {
        phase: 'Phase 1: Feet Together',
        angle: '0° - 5° (Adducted)',
        instruction: 'Stand upright with legs parallel.'
      },
      {
        phase: 'Phase 2: Lateral Leg Lift',
        angle: '30° - 40° (Abducted)',
        instruction: 'Lift the active leg directly out to the side without leaning your torso.'
      },
      {
        phase: 'Phase 3: Steady Lowering',
        angle: '0° - 5°',
        instruction: 'Return foot slowly to the floor without swinging.'
      }
    ],
    commonMistakes: [
      {
        mistake: 'Leaning Torso to the Opposite Side',
        consequence: 'Uses momentum and spine lateral flexion instead of glute medius.',
        correction: 'Keep shoulders and pelvis completely horizontal.'
      }
    ],
    animKey: 'standing_hip_abduction'
  },

  'Standing Hip Flexion': {
    name: 'Standing Hip Flexion',
    category: 'Lower Body',
    targetJoints: 'Hip Joint & Knee Joint',
    targetMuscles: 'Iliopsoas, Rectus Femoris, Pectineus',
    difficulty: 'Beginner',
    overview: 'Standing high knee raise to improve hip flexor strength, gait clearance, and single-leg balance.',
    startingPosition: {
      posture: 'Stand tall with feet hip-width apart, holding a support if necessary.',
      jointSetup: 'Standing leg straight; target leg ready to lift.',
      cues: ['Keep standing knee soft, not hyperextended.', 'Lift knee straight forward.']
    },
    cameraPlacement: {
      view: 'Side Profile (90°)',
      distance: '6 - 8 ft (1.8 - 2.4 m)',
      height: 'Waist height',
      guidelines: ['Side profile showing hip, knee, and ankle trajectories.']
    },
    movementPhases: [
      {
        phase: 'Phase 1: Standing Neutral',
        angle: '165°+ (Hip angle)',
        instruction: 'Both feet on floor, upright stance.'
      },
      {
        phase: 'Phase 2: High Knee Drive',
        angle: '90° - 100° (Hip angle)',
        instruction: 'Lift knee upward until thigh is parallel to the floor (90° hip flexion).'
      },
      {
        phase: 'Phase 3: Lowering Step',
        angle: '165°+ (Hip angle)',
        instruction: 'Gently lower foot back to the ground.'
      }
    ],
    commonMistakes: [
      {
        mistake: 'Rounding the Lower Back',
        consequence: 'Posterior pelvic tilt stresses lumbar spine.',
        correction: 'Keep chest lifted and spine tall throughout the knee lift.'
      }
    ],
    animKey: 'standing_hip_flexion'
  },

  'Marching in Place': {
    name: 'Marching in Place',
    category: 'Lower Body & Dynamic',
    targetJoints: 'Hips & Knees Bilaterally',
    targetMuscles: 'Hip Flexors, Quadriceps, Core Stabilizers',
    difficulty: 'Beginner',
    overview: 'Rhythmic marching pattern to elevate heart rate, improve dynamic balance, and reinforce hip flexion mechanics.',
    startingPosition: {
      posture: 'Stand tall with arms relaxed or bent at 90° for reciprocal arm swing.',
      jointSetup: 'Feet hip-width apart.',
      cues: ['March with steady, even cadence.', 'Lift knees to hip height.']
    },
    cameraPlacement: {
      view: 'Front View or Side View',
      distance: '6 - 8 ft (1.8 - 2.4 m)',
      height: 'Waist height',
      guidelines: ['Full body in frame.']
    },
    movementPhases: [
      {
        phase: 'Phase 1: Ready Stance',
        angle: '160°+',
        instruction: 'Feet grounded, core braced.'
      },
      {
        phase: 'Phase 2: Knee Lift',
        angle: '90° - 110°',
        instruction: 'Drive alternate knee up toward chest.'
      },
      {
        phase: 'Phase 3: Alternating Step',
        angle: '160°+',
        instruction: 'Step down lightly and switch to opposite leg.'
      }
    ],
    commonMistakes: [
      {
        mistake: 'Stomping Feet',
        consequence: 'Sends high-impact shock through joints.',
        correction: 'Land softly on the ball of the foot and roll onto heel.'
      }
    ],
    animKey: 'standing_hip_flexion'
  },

  'Calf Raise': {
    name: 'Calf Raise',
    category: 'Lower Body',
    targetJoints: 'Ankle Joint (Talocrural) & MTP',
    targetMuscles: 'Gastrocnemius, Soleus, Tibialis Posterior',
    difficulty: 'Beginner',
    overview: 'Plantarflexion training strengthening calf muscles for push-off power, ankle stability, and tendon health.',
    startingPosition: {
      posture: 'Stand tall with feet hip-width apart, holding wall or chair lightly for balance.',
      jointSetup: 'Knees straight but not locked.',
      cues: ['Distribute weight evenly across the balls of all toes.', 'Keep ankles from rolling outward.']
    },
    cameraPlacement: {
      view: 'Side Profile',
      distance: '6 - 8 ft (1.8 - 2.4 m)',
      height: 'Knee height',
      guidelines: ['Ensure feet, ankles, and calves are clearly visible.']
    },
    movementPhases: [
      {
        phase: 'Phase 1: Heels Grounded',
        angle: '0 mm lift',
        instruction: 'Feet flat on floor.'
      },
      {
        phase: 'Phase 2: Peak Plantarflexion',
        angle: 'Max heel elevation',
        instruction: 'Rise up onto the balls of your feet as high as possible, squeezing calves at the top.'
      },
      {
        phase: 'Phase 3: Smooth Lowering',
        angle: '0 mm lift',
        instruction: 'Lower heels back to floor with a controlled 2-second descent.'
      }
    ],
    commonMistakes: [
      {
        mistake: 'Ankles Rolling Outward (Inversion)',
        consequence: 'Strains lateral ankle ligaments.',
        correction: 'Push primarily through the big toe and second toe joint.'
      }
    ],
    animKey: 'calf_raise'
  },

  'Single-Leg Balance': {
    name: 'Single-Leg Balance',
    category: 'Balance & Stability',
    targetJoints: 'Ankle, Knee, Hip (Proprioception)',
    targetMuscles: 'Ankle Stabilizers, Gluteus Medius, Core',
    difficulty: 'Beginner to Intermediate',
    overview: 'Static balance hold training ankle proprioception and unilateral hip stability.',
    startingPosition: {
      posture: 'Stand tall near a wall or sturdy counter for safety.',
      jointSetup: 'Shift weight to one leg; lift the opposite foot 2-3 inches off the ground.',
      cues: ['Fix your gaze on an unmoving spot ahead.', 'Keep supporting knee softly unlocked.']
    },
    cameraPlacement: {
      view: 'Front View',
      distance: '6 - 8 ft (1.8 - 2.4 m)',
      height: 'Waist height',
      guidelines: ['Full body centered in frame.']
    },
    movementPhases: [
      {
        phase: 'Phase 1: Weight Shift',
        angle: 'Neutral stance',
        instruction: 'Transfer weight smoothly to stance leg.'
      },
      {
        phase: 'Phase 2: Unilateral Hold',
        angle: 'Single-leg elevation',
        instruction: 'Hold balance steady for prescribed duration (e.g. 15-30s).'
      },
      {
        phase: 'Phase 3: Controlled Touchdown',
        angle: 'Both feet grounded',
        instruction: 'Place elevated foot back to the floor.'
      }
    ],
    commonMistakes: [
      {
        mistake: 'Locking / Hyperextending the Stance Knee',
        consequence: 'Disengages stabilizing muscles and jams joint capsule.',
        correction: 'Maintain a soft 5° micro-bend in the supporting knee.'
      }
    ],
    animKey: 'single_leg_balance'
  },

  'Bird Dog': {
    name: 'Bird Dog',
    category: 'Core & Spine',
    targetJoints: 'Shoulders, Hips & Spine',
    targetMuscles: 'Erector Spinae, Multifidus, Gluteus Maximus, Deltoids, Core',
    difficulty: 'Intermediate',
    overview: 'Quadruped core and back stabilization exercise building spinal endurance with minimal compressive load.',
    startingPosition: {
      posture: 'On all fours on an exercise mat (quadruped position).',
      jointSetup: 'Hands directly under shoulders, knees directly under hips. Spine neutral.',
      cues: ['Keep neck in line with spine (gaze at mat).', 'Do not rotate pelvis as limbs elevate.']
    },
    cameraPlacement: {
      view: 'Side Profile (90°)',
      distance: '6 - 8 ft (1.8 - 2.4 m)',
      height: 'Floor / Mat level',
      guidelines: ['Capture full body horizontally from fingertips to toes.']
    },
    movementPhases: [
      {
        phase: 'Phase 1: Quadruped Ready',
        angle: 'Neutral 4-point stance',
        instruction: 'Hands under shoulders, knees under hips.'
      },
      {
        phase: 'Phase 2: Opposite Reach',
        angle: '180° straight alignment',
        instruction: 'Simultaneously reach one arm forward and opposite leg straight back until parallel to floor.'
      },
      {
        phase: 'Phase 3: Return to Quadruped',
        angle: 'Neutral 4-point stance',
        instruction: 'Slowly return hand and knee to mat without shifting torso.'
      }
    ],
    commonMistakes: [
      {
        mistake: 'Arching Spine / Hyperextending Leg Too High',
        consequence: 'Stresses lumbar vertebrae instead of isolating glutes/multifidus.',
        correction: 'Only lift limbs to horizontal (parallel to floor); keep abs braced.'
      }
    ],
    animKey: 'bird_dog'
  },

  'Lunge': {
    name: 'Lunge',
    category: 'Lower Body',
    targetJoints: 'Anterior & Posterior Knees, Hips, Ankles',
    targetMuscles: 'Quadriceps, Gluteus Maximus, Hamstrings, Calves',
    difficulty: 'Intermediate',
    overview: 'Unilateral split stance exercise developing lower extremity strength, hip mobility, and balance.',
    startingPosition: {
      posture: 'Stand tall with feet hip-width apart.',
      jointSetup: 'Take a long step forward (approx. 3 feet) into a split stance.',
      cues: ['Keep torso upright throughout descent.', 'Front knee stays aligned with 2nd toe.']
    },
    cameraPlacement: {
      view: 'Side Profile (90°)',
      distance: '7 - 9 ft (2.1 - 2.7 m)',
      height: 'Waist height',
      guidelines: ['Side view capturing both lead and rear legs clearly.']
    },
    movementPhases: [
      {
        phase: 'Phase 1: Split Stance Ready',
        angle: '160°+ (Both knees)',
        instruction: 'Tall posture, weight evenly distributed between feet.'
      },
      {
        phase: 'Phase 2: Double 90° Lunge Depth',
        angle: '90° - 105° (Front knee)',
        instruction: 'Lower hips vertically until front knee reaches 90° and back knee hovers 2 inches above mat.'
      },
      {
        phase: 'Phase 3: Drive Upwards',
        angle: '160°+ (Both knees)',
        instruction: 'Push through front heel to return to standing position.'
      }
    ],
    commonMistakes: [
      {
        mistake: 'Front Knee Traveling Far Past Toes',
        consequence: 'Increases patellofemoral shear stress.',
        correction: 'Step further forward and drop hips straight down rather than forward.'
      }
    ],
    animKey: 'lunge'
  },

  'Wall Slides': {
    name: 'Wall Slides',
    category: 'Upper Body & Scapular',
    targetJoints: 'Scapulothoracic & Glenohumeral',
    targetMuscles: 'Serratus Anterior, Lower Trapezius, Rotator Cuff',
    difficulty: 'Beginner',
    overview: 'Postural and scapular upward rotation exercise to improve shoulder overhead mechanics and reduce impingement.',
    startingPosition: {
      posture: 'Stand with back against a flat wall, heels 6 inches from wall, lower back and head contacting wall.',
      jointSetup: 'Arms in a "W" position with elbows and backs of hands touching wall.',
      cues: ['Keep wrists and elbows in contact with the wall.', 'Slide arms upward in a "Y" shape.']
    },
    cameraPlacement: {
      view: 'Front View',
      distance: '6 - 8 ft (1.8 - 2.4 m)',
      height: 'Chest height',
      guidelines: ['Capture entire upper body and wall contact.']
    },
    movementPhases: [
      {
        phase: 'Phase 1: "W" Starting Position',
        angle: 'Elbows at 90° against wall',
        instruction: 'Elbows tucked by sides, forearms flush against wall.'
      },
      {
        phase: 'Phase 2: Overhead "Y" Slide',
        angle: 'Arms fully extended overhead in "Y"',
        instruction: 'Slide forearms smoothly upward along the wall without letting elbows leave the surface.'
      },
      {
        phase: 'Phase 3: Controlled Pull Down',
        angle: 'Return to "W"',
        instruction: 'Pull shoulder blades down and back to return to "W" position.'
      }
    ],
    commonMistakes: [
      {
        mistake: 'Arching Back to Keep Arms on Wall',
        consequence: 'Strains lower back to compensate for poor thoracic/shoulder mobility.',
        correction: 'Keep ribcage down and abdominals tight against the wall.'
      }
    ],
    animKey: 'wall_slides'
  },

  'Squat': {
    name: 'Squat',
    category: 'Lower Body',
    targetJoints: 'Hips, Knees, Ankles',
    targetMuscles: 'Quadriceps, Gluteus Maximus, Hamstrings, Core',
    difficulty: 'Beginner to Intermediate',
    overview: 'Fundamental compound rehabilitation movement for lower body strength and hip-knee-ankle coordination.',
    startingPosition: {
      posture: 'Stand with feet shoulder-width apart, toes turned slightly out 10°.',
      jointSetup: 'Spine neutral, arms extended in front for counterbalance.',
      cues: ['Send hips back as if sitting in a chair.', 'Keep chest proud and eyes forward.']
    },
    cameraPlacement: {
      view: 'Side Profile or 45° Angle',
      distance: '7 - 9 ft (2.1 - 2.7 m)',
      height: 'Waist height',
      guidelines: ['Capture full body from head to feet.']
    },
    movementPhases: [
      {
        phase: 'Phase 1: Standing Ready',
        angle: '165°+ (Knee angle)',
        instruction: 'Upright posture, core engaged.'
      },
      {
        phase: 'Phase 2: Parallel Squat Depth',
        angle: '90° - 100° (Knee angle)',
        instruction: 'Hinge hips and bend knees until thighs are roughly parallel with floor.'
      },
      {
        phase: 'Phase 3: Drive Up',
        angle: '165°+ (Knee angle)',
        instruction: 'Push through midfoot and heels to return to full extension.'
      }
    ],
    commonMistakes: [
      {
        mistake: 'Knee Valgus (Inward Collapse)',
        consequence: 'Increases ACL strain.',
        correction: 'Actively push knees outward over toes.'
      }
    ],
    animKey: 'squat'
  }
};

/**
 * Helper to get tutorial data with safe fallback for any exercise name
 */
export function getExerciseTutorial(exerciseName) {
  if (!exerciseName) return EXERCISE_TUTORIALS['Bicep Curl (Standing)'];
  
  if (EXERCISE_TUTORIALS[exerciseName]) {
    return EXERCISE_TUTORIALS[exerciseName];
  }

  // Exact or alias match
  const lower = exerciseName.toLowerCase();
  for (const [key, tutorial] of Object.entries(EXERCISE_TUTORIALS)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return tutorial;
    }
  }

  // Smart fallback based on category / keywords
  let matchedAnim = 'bicep_curl_horizontal';
  let category = 'General Rehabilitation';
  if (lower.includes('push') || lower.includes('press')) {
    matchedAnim = 'pushup';
    category = 'Upper Body';
  } else if (lower.includes('squat')) {
    matchedAnim = 'squat';
    category = 'Lower Body';
  } else if (lower.includes('knee flexion') || lower.includes('hamstring')) {
    matchedAnim = 'standing_knee_flexion';
    category = 'Lower Body';
  } else if (lower.includes('knee extension')) {
    matchedAnim = 'knee_extension';
    category = 'Lower Body';
  } else if (lower.includes('leg raise')) {
    matchedAnim = 'leg_raise';
    category = 'Lower Body & Core';
  } else if (lower.includes('crunch') || lower.includes('ab')) {
    matchedAnim = 'crunch';
    category = 'Core';
  } else if (lower.includes('lunge')) {
    matchedAnim = 'lunge';
    category = 'Lower Body';
  } else if (lower.includes('calf')) {
    matchedAnim = 'calf_raise';
    category = 'Lower Body';
  } else if (lower.includes('bird dog')) {
    matchedAnim = 'bird_dog';
    category = 'Core & Spine';
  } else if (lower.includes('shoulder abduction') || lower.includes('lateral raise')) {
    matchedAnim = 'shoulder_abduction';
    category = 'Upper Body';
  } else if (lower.includes('shoulder')) {
    matchedAnim = 'shoulder_flexion';
    category = 'Upper Body';
  } else if (lower.includes('balance')) {
    matchedAnim = 'single_leg_balance';
    category = 'Balance';
  } else if (lower.includes('march') || lower.includes('hip flexion')) {
    matchedAnim = 'standing_hip_flexion';
    category = 'Lower Body';
  } else if (lower.includes('hip abduction')) {
    matchedAnim = 'standing_hip_abduction';
    category = 'Lower Body';
  }

  return {
    name: exerciseName,
    category,
    targetJoints: 'Primary Target Joint Axis',
    targetMuscles: 'Rehabilitation Target Muscle Groups',
    difficulty: 'Beginner',
    overview: `Clinical movement training for ${exerciseName}. Follow the real-time AI skeleton guidance and auditory coach for optimal posture.`,
    startingPosition: {
      posture: 'Position your body in the designated posture shown in the visual demonstration.',
      jointSetup: 'Align joints in the designated starting orientation indicated by the AI overlay.',
      cues: [
        'Ensure full range of motion without jerking.',
        'Breathe rhythmically throughout the movement.'
      ]
    },
    cameraPlacement: {
      view: 'Front View or Side Profile as prescribed',
      distance: '6 - 8 ft (1.8 - 2.4 m)',
      height: 'Waist to chest level',
      guidelines: [
        'Ensure target joints are clearly visible in the camera frame without obstruction.'
      ]
    },
    movementPhases: [
      {
        phase: 'Phase 1: Starting Position',
        angle: 'Neutral Initial Range',
        instruction: 'Align body and wait for AI vision keypoint lock.'
      },
      {
        phase: 'Phase 2: Target Peak Movement',
        angle: 'Prescribed Target Range',
        instruction: 'Smoothly move into peak flexion or extension until repetition triggers.'
      },
      {
        phase: 'Phase 3: Return to Start',
        angle: 'Neutral Rest',
        instruction: 'Return with control to complete the repetition cycle.'
      }
    ],
    commonMistakes: [
      {
        mistake: 'Rushing Repetitions',
        consequence: 'Degrades tracking accuracy and muscular endurance benefits.',
        correction: 'Perform each phase with smooth, controlled cadence.'
      }
    ],
    animKey: matchedAnim
  };
}
