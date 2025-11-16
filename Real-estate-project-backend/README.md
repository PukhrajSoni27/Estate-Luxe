# Real-estate-project-backend

This folder contains a FastAPI backend that serves a trained XGBoost model for house price prediction.

Quick setup (Windows)

1. Open PowerShell and change to this folder:

```pwsh
cd Real-estate-project-backend/Backend
```

2. Create a Python virtual environment and install dependencies:

```pwsh
pwsh -NoProfile -ExecutionPolicy Bypass -File setup_env.ps1
```

3. Start the backend (development):

```pwsh
pwsh -NoProfile -ExecutionPolicy Bypass -File start-backend.ps1
```

The API will be available at `http://127.0.0.1:8000`.

Important endpoints

- `GET /health` — health and model status
- `GET /columns` — model feature columns
- `POST /predict` — run prediction (body: `{ features_by_name: { ... } }`)
- `POST /predict_local` — alternate test endpoint
 - `POST /report` — generate a PDF valuation report (body: JSON with `valuation`, `features`, optional `notes`)

Notes

- The frontend reads the backend base URL from `VITE_API_URL` (in project root `.env`). Ensure that points to `http://localhost:8000` during development.
- If `pip` or `python` are not on PATH, run the scripts from an environment where Python is available.

PDF generation

- The backend can generate a simple PDF report via `POST /report`.
- This endpoint uses the `reportlab` package. To install the dependency into the backend venv run:

```pwsh
cd Real-estate-project-backend/Backend
.\.venv\Scripts\Activate.ps1
pip install -r requirements-backend.txt
```

Restart the backend after installing new packages.
