"""
J.A.R.V.I.S. Desktop Neural Interface Launcher
Launches backend and dedicated standalone desktop HUD window (frameless app mode).
"""

import os
import sys
import time
import subprocess
import urllib.request
import urllib.error
import webbrowser

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
FRONTEND_DIST = os.path.join(FRONTEND_DIR, "dist")
PROFILE_DIR = os.path.join(BASE_DIR, ".jarvis_profile")
PORT = 8000
SERVER_URL = f"http://127.0.0.1:{PORT}"
HEALTH_URL = f"{SERVER_URL}/api/health"

def log(msg: str):
    print(f"[J.A.R.V.I.S. DESKTOP] {msg}", flush=True)

def is_backend_healthy() -> bool:
    """Check if FastAPI backend is healthy and responding."""
    try:
        req = urllib.request.Request(HEALTH_URL, headers={"User-Agent": "JarvisDesktopLauncher/1.0"})
        with urllib.request.urlopen(req, timeout=1.5) as resp:
            return resp.status == 200
    except Exception:
        return False

def ensure_frontend_built():
    """Ensure frontend production build exists so FastAPI can serve it."""
    index_html = os.path.join(FRONTEND_DIST, "index.html")
    if not os.path.exists(index_html):
        log("Compiling holographic frontend neural HUD assets...")
        cmd = "cmd.exe /c npm run build"
        subprocess.run(cmd, shell=True, cwd=FRONTEND_DIR, check=True)
        log("Frontend build completed.")

def start_backend():
    """Start uvicorn server if not already running."""
    if is_backend_healthy():
        log("Neural Core Backend is already online.")
        return None

    log("Initializing J.A.R.V.I.S. Neural Core (FastAPI uvicorn)...")
    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"

    log_path = os.path.join(BACKEND_DIR, "jarvis_server.log")
    server_log = open(log_path, "a", encoding="utf-8")

    # Start detached/independent background server process
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", f"--port={PORT}"],
        cwd=BACKEND_DIR,
        env=env,
        stdout=server_log,
        stderr=subprocess.STDOUT
    )

    # Wait for server to become responsive
    log("Awaiting neural subsystem stabilization...")
    start_time = time.time()
    while time.time() - start_time < 15:
        if is_backend_healthy():
            log(f"Neural Core verified online at {SERVER_URL}")
            return proc
        time.sleep(0.5)

    log("Warning: Backend readiness check timed out. Proceeding to launch interface...")
    return proc

def get_browser_executable() -> str:
    """Find installed Chrome or Edge executable for standalone app window."""
    candidates = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe"),
    ]
    for path in candidates:
        if os.path.exists(path):
            return path
    return ""

def create_desktop_shortcut():
    """Create a 1-click Windows Desktop shortcut on the user's Desktop."""
    try:
        ps_script = os.path.join(BASE_DIR, "create_shortcut.ps1")
        target_bat = os.path.join(BASE_DIR, "run_jarvis.bat")
        if os.path.exists(ps_script):
            cmd = [
                "powershell",
                "-ExecutionPolicy", "Bypass",
                "-File", ps_script,
                "-Target", target_bat,
                "-WorkingDir", BASE_DIR
            ]
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=8)
            if "SUCCESS" in res.stdout:
                log(res.stdout.strip())
            else:
                log(f"Desktop shortcut setup completed.")
    except Exception as e:
        log(f"Desktop shortcut creation skipped: {e}")

def launch_desktop_window(dev_mode: bool = False):
    """Launch dedicated frameless standalone Desktop Window (App Mode)."""
    target_url = "http://localhost:5173" if dev_mode else SERVER_URL
    browser = get_browser_executable()

    if browser:
        log(f"Activating J.A.R.V.I.S. Desktop HUD via {os.path.basename(browser)} App Mode...")
        os.makedirs(PROFILE_DIR, exist_ok=True)
        
        # Windows command to open in app window mode
        cmd = f'start "" "{browser}" --app={target_url} --user-data-dir="{PROFILE_DIR}" --window-size=1440,900 --start-maximized --autoplay-policy=no-user-gesture-required --app-name=JARVIS'
        subprocess.Popen(f"cmd.exe /c {cmd}", shell=True)
    else:
        log("Opening in default browser...")
        webbrowser.open(target_url)

def main():
    dev_mode = "--dev" in sys.argv
    log("==================================================")
    log(" J.A.R.V.I.S. — NEURAL INTERFACE DESKTOP LAUNCHER")
    log("==================================================")

    # 1. Ensure production assets exist if running standard mode
    if not dev_mode:
        ensure_frontend_built()

    # 2. Start / verify backend server
    start_backend()

    # 3. Create Windows Desktop 1-click shortcut
    create_desktop_shortcut()

    # 4. Launch Desktop Window
    launch_desktop_window(dev_mode=dev_mode)
    log("J.A.R.V.I.S. HUD successfully activated on your desktop.")
    log("==================================================")

if __name__ == "__main__":
    main()
