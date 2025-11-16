<#
start-backend.ps1
Start the FastAPI backend using the venv's Python (Windows-friendly).
#>
$venv = ".\.venv"
$python = "python"
if (Test-Path "$venv\Scripts\python.exe") {
    $python = "$venv\Scripts\python.exe"
}

Write-Host "Using Python: $python"
Write-Host "Starting FastAPI (uvicorn) on http://127.0.0.1:8000"
& $python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
