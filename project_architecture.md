# PoseCare: Project Architecture

This document describes the technical architecture, data pipelines, and component structure of the **PoseCare** digital physical rehabilitation platform.

---

## 1. High-Level System Architecture

PoseCare is built as a decoupled, multi-service system comprising a single-page React frontend, a Node/Express backend, and a Python Flask computer vision microservice.

```mermaid
graph LR
    subgraph Client ["React Frontend Client (Vite)"]
        A["Patient View / WebCam Feed"]
        B["Doctor Dashboard / Charts"]
        C["Canvas Gaming Engines"]
    end

    subgraph Services ["Backend Services Layer"]
        D["Node/Express Backend (Port 5000)"]
        E["Python Flask CV Service (Port 8000)"]
    end

    subgraph Database ["Data Store"]
        F[("MongoDB Atlas (Cloud Cluster)")]
        G["MediaPipe Pose Models"]
    end

    A <-->|REST API| D
    B <-->|REST API| D
    A -->|Video Frame Images| E
    E -->|Pose Landmarkers & Angles| A
    E -.->|Load Models| G
    D <-->|Mongoose Queries| F
```

---

## 2. Component Subsystems

### 💻 1. Frontend SPA (`rehab-ai`)
- **Core Framework**: React (Vite environment) styled with Vanilla CSS and Tailwind utility tokens.
- **Visual Analytics**: Recharts and SVG wrappers plotting patient session records dynamically.
- **Clinical Gaming Engines (`src/games/`)**: Canvas-rendered trackers drawing skeleton joints and overlays:
  - `standardTracker.js`: Mirror camera feed overlaid with joint landmarks.
  - `mannequinTracker.js`: Rotatable 3D hologram avatar.
  - `shadowMatch.js`: Interactive silhouette keyhole matching.
  - `flappyRehab.js`: Altitude flyer mapped to joint extension/flexion.
  - `rehabRunner.js` & `zenBloom.js`: Specialized ROM holds trackers.

### ⚙️ 2. Express Backend (`rehab-backend`)
- **Core Framework**: Node.js and Express REST APIs.
- **Database ORM**: Mongoose mapping MongoDB collections:
  - `User Schema`: Credentials, focus areas, user roles (doctor vs. patient).
  - `Prescription Schema`: Target angles, hold durations, and repetition goals.
  - `SessionLog Schema`: Completed reps, max angles reached, and dates.
- **Services**: Automated seeding utilities, password-based authentication controllers (with legacy OTP code boundaries preserved).

### 👁️ 3. Computer Vision Service (`cv-service`)
- **Core Framework**: Python and Flask.
- **Pose Landmarking Engine**: Google MediaPipe Pose models translating frame images to 33 landmark coordinates.
- **Exercise Analyzers (`exercises/analyzers/`)**:
  - `geometry.py`: Calculates mathematical angles between 3 coordinate coordinates.
  - `joint_angle.py`: Custom analyzers class registry (e.g. `ElbowFlexionAnalyzer`, `BicepCurlShoulderAnalyzer`).
  - `registry.py`: Holds target guidelines, good/bad feedback thresholds, and calibrations.

---

## 3. Data Pipeline: Exercise Session tracking

The diagram below illustrates how joint coordinates are captured, analyzed, and logged in real-time during a training session:

```mermaid
sequenceDiagram
    autonumber
    actor Patient
    participant Frontend as React Client
    participant CV as Flask CV Service
    participant Backend as Express Backend
    participant DB as MongoDB

    Patient->>Frontend: Select Exercise & Start Session
    Frontend->>Patient: Initialize WebCam Stream
    loop Live tracking
        Frontend->>CV: Post Camera Feed Frame
        Note over CV: MediaPipe extracts 33 body coordinate landmarks
        CV->>CV: Calculate angles & check posture rules
        CV-->>Frontend: Return Landmark coords, angles, and feedback
        Frontend->>Frontend: Update Canvas game state & draw overlay
    end
    Patient->>Frontend: Click "Complete & Log Session"
    Frontend->>Backend: Post Session log (Reps completed, max angle, game)
    Backend->>DB: Save SessionLog Document
    DB-->>Backend: Acknowledge Write
    Backend-->>Frontend: Return Saved Status
    Frontend->>Patient: Show Success Screen & Award XP
```
