<#
setup_env.ps1
Create a Python virtual environment and install backend dependencies on Windows.
#>
$venv = ".\.venv"
if (-Not (Test-Path $venv)) {
    Write-Host "Creating virtual environment at $venv..."
    python -m venv $venv
} else {
    Write-Host "Virtual environment already exists at $venv"
}

Write-Host "Upgrading pip and installing requirements..."
& $venv\Scripts\python.exe -m pip install --upgrade pip
& $venv\Scripts\python.exe -m pip install -r requirements-backend.txt

Write-Host "\nSetup complete. To run the backend (development) use:\n"
Write-Host "  pwsh -NoProfile -ExecutionPolicy Bypass -File start-backend.ps1"
Write-Host "or directly:\n  $venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"
