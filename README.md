# PoseCare (RehabSync) Rehabilitation Platform

PoseCare (formerly RehabSync) is a digital physical rehabilitation platform designed to facilitate patient recovery tracking through real-time computer vision joint angle analysis and gamified rehabilitation exercises.

The system is split into three decoupled components:
1. **Frontend SPA (`rehab-ai`)**: React single-page application providing patient gamified exercises and a clinician dashboard.
2. **Express Backend (`rehab-backend`)**: Node.js REST API providing patient-doctor prescriptions database storage, login credentials, and session logs.
3. **Computer Vision Service (`cv-service`)**: Flask Python microservice utilizing Google MediaPipe Pose models to analyze webcam video feeds and compute joint range of motion (ROM) in real time.

---

## 🏗️ System Architecture & Data Pipeline

For detailed structural specifications and diagrams, please refer to:
*   [project_architecture.md](file:///e:/rehab-ai-platform-main/project_architecture.md) — Technical structure, components, and Mermaid flows.
*   [walkthrough.md](file:///e:/rehab-ai-platform-main/walkthrough.md) — Walkthrough of features, game modes, authentication flows, and verification steps.

---

## 📂 Project Structure

```text
├── rehab-ai/              # React SPA (Vite + CSS + Tailwind)
├── rehab-backend/         # Node.js + Express + Mongoose server
├── cv-service/            # Flask + MediaPipe joint analyzer
├── project_architecture.md# Technical architecture details
└── walkthrough.md         # Deployment verification and features index
```

---

## 🚀 Getting Started & Local Setup

### 1. Computer Vision Service (`cv-service`)
The computer vision service processes live webcam frames and computes joint angles.
*   **Path**: [`cv-service/`](file:///e:/rehab-ai-platform-main/cv-service)
*   **Port**: `http://localhost:8000`

1. Navigate to the directory:
   ```bash
   cd cv-service
   ```
2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the Flask server:
   ```bash
   python app.py
   ```

### 2. Express Backend Server (`rehab-backend`)
Stores accounts, logs workout history, and configures patient-specific prescriptions.
*   **Path**: [`rehab-backend/`](file:///e:/rehab-ai-platform-main/rehab-backend)
*   **Port**: `http://localhost:5000`

1. Navigate to the directory:
   ```bash
   cd rehab-backend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Ensure `.env` is populated with correct DB credentials (MongoDB URI, JWT secret, etc.).
4. Start the Node API server:
   ```bash
   node server.js
   ```

### 3. Frontend Client SPA (`rehab-ai`)
The user interface where patients play exercises and doctors assign goals.
*   **Path**: [`rehab-ai/`](file:///e:/rehab-ai-platform-main/rehab-ai)
*   **Port**: `http://localhost:5173`

1. Navigate to the directory:
   ```bash
   cd rehab-ai
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

---

## 🛠️ Technology Stack

*   **Frontend**: React (Vite), Tailwind CSS, Recharts (data visualizations), Web Speech API.
*   **Backend**: Node.js, Express, Mongoose / MongoDB Atlas, JWT.
*   **Computer Vision**: Python 3, Flask, Google MediaPipe Pose, OpenCV, NumPy.
