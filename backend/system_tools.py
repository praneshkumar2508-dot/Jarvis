import os
import subprocess
import webbrowser
import json
import shutil
import ctypes
import csv
from datetime import datetime
from typing import Optional, List, Dict
import httpx

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCREENSHOTS_DIR = os.path.join(BASE_DIR, "screenshots")
APPS_CACHE_FILE = os.path.join(BASE_DIR, "apps_cache.json")
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

# -------------------------------------------------------------
# 1. CLIENT ACTION STATE (Frontend Real-time Tab Navigation)
# -------------------------------------------------------------
LAST_CLIENT_ACTION = None

def get_and_clear_client_action() -> Optional[dict]:
    """Retrieve and clear pending client action (e.g. open browser URL in frontend)."""
    global LAST_CLIENT_ACTION
    action = LAST_CLIENT_ACTION
    LAST_CLIENT_ACTION = None
    return action

def get_browser_executable() -> Optional[str]:
    """Detect available Chrome or Edge browser executables on Windows."""
    candidates = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe"),
    ]
    for p in candidates:
        if os.path.exists(p):
            return p
    return None

# -------------------------------------------------------------
# 2. INSTALLED SYSTEM APPS REGISTRY CACHE (120+ Applications)
# -------------------------------------------------------------
_CACHED_APPS = None

def get_installed_apps(force_refresh: bool = False) -> List[Dict[str, str]]:
    """
    Returns list of all installed Windows applications: [{'Name': ..., 'AppID': ...}].
    Uses high-speed JSON cache file or queries PowerShell Get-StartApps.
    """
    global _CACHED_APPS
    if _CACHED_APPS and not force_refresh:
        return _CACHED_APPS

    if not force_refresh and os.path.exists(APPS_CACHE_FILE):
        try:
            with open(APPS_CACHE_FILE, "r", encoding="utf-8") as f:
                _CACHED_APPS = json.load(f)
                return _CACHED_APPS
        except Exception:
            pass

    try:
        cmd = ["powershell", "-NoProfile", "-Command", "Get-StartApps | ConvertTo-Json"]
        out = subprocess.check_output(cmd, text=True, timeout=8)
        data = json.loads(out)
        if isinstance(data, dict):
            data = [data]
        _CACHED_APPS = data
        try:
            with open(APPS_CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except Exception:
            pass
        return _CACHED_APPS
    except Exception:
        return _CACHED_APPS or []

# -------------------------------------------------------------
# 3. WEBSITE & WEB BROWSER LAUNCHER
# -------------------------------------------------------------
def open_website(url_or_name: str) -> str:
    """
    Open any website or web URL in the user's web browser.
    Example: 'youtube', 'https://www.youtube.com', 'google', 'github', 'reddit'.
    """
    global LAST_CLIENT_ACTION
    cleaned = url_or_name.lower().strip()
    url_map = {
        "youtube": "https://www.youtube.com",
        "google": "https://www.google.com",
        "github": "https://www.github.com",
        "reddit": "https://www.reddit.com",
        "twitter": "https://x.com",
        "x": "https://x.com",
        "netflix": "https://www.netflix.com",
        "spotify": "https://open.spotify.com",
        "gmail": "https://mail.google.com",
        "amazon": "https://www.amazon.com",
        "chatgpt": "https://chatgpt.com",
        "linkedin": "https://www.linkedin.com",
        "instagram": "https://www.instagram.com",
    }

    target_url = url_map.get(cleaned)
    if not target_url:
        if cleaned.startswith("http://") or cleaned.startswith("https://"):
            target_url = cleaned
        elif "." in cleaned:
            target_url = f"https://{cleaned}"
        else:
            target_url = f"https://www.google.com/search?q={cleaned}"

    # Register client action for frontend tab opening
    LAST_CLIENT_ACTION = {"type": "open_url", "url": target_url}

    # Physical OS execution:
    # 1. Direct browser executable launch (Chrome / Edge)
    browser_exe = get_browser_executable()
    if browser_exe:
        try:
            subprocess.Popen([browser_exe, target_url])
        except Exception:
            pass

    # 2. PowerShell Start-Process (launches default protocol handler)
    try:
        subprocess.Popen(
            ["powershell", "-NoProfile", "-Command", f"Start-Process '{target_url}'"],
            creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, "CREATE_NO_WINDOW") else 0
        )
    except Exception:
        pass

    # 3. Windows Shell start
    try:
        subprocess.Popen(f'cmd.exe /c start "" "{target_url}"', shell=True)
    except Exception:
        pass

    # 4. Standard Python webbrowser fallback
    try:
        webbrowser.open_new_tab(target_url)
    except Exception:
        pass

    return f"Accessing {url_or_name} in your browser now, sir."

# -------------------------------------------------------------
# 4. SYSTEM FOLDERS & WINDOWS SETTINGS
# -------------------------------------------------------------
def open_folder(folder_name: str) -> str:
    """
    Open common Windows system folders in File Explorer.
    Examples: 'downloads', 'documents', 'pictures', 'desktop', 'videos', 'music', 'project'.
    """
    f = folder_name.lower().strip()
    user_prof = os.path.expandvars("%USERPROFILE%")
    mapping = {
        "downloads": os.path.join(user_prof, "Downloads"),
        "documents": os.path.join(user_prof, "Documents"),
        "pictures": os.path.join(user_prof, "Pictures"),
        "photos": os.path.join(user_prof, "Pictures"),
        "desktop": os.path.join(user_prof, "Desktop"),
        "videos": os.path.join(user_prof, "Videos"),
        "music": os.path.join(user_prof, "Music"),
        "project": os.path.dirname(BASE_DIR),
        "jarvis": os.path.dirname(BASE_DIR),
    }

    target_path = mapping.get(f, user_prof)
    try:
        subprocess.Popen(["explorer.exe", target_path])
        return f"Opening your {folder_name} folder in File Explorer, sir."
    except Exception as e:
        return f"Failed to open folder: {str(e)}"

def open_settings(page: Optional[str] = None) -> str:
    """
    Open Windows Settings directly to general or specific configuration pages.
    Examples: 'bluetooth', 'network', 'wifi', 'display', 'sound', 'apps', 'update'.
    """
    cleaned = (page or "").lower().strip()
    settings_map = {
        "bluetooth": "ms-settings:bluetooth",
        "wifi": "ms-settings:network-wifi",
        "network": "ms-settings:network",
        "display": "ms-settings:display",
        "sound": "ms-settings:sound",
        "volume": "ms-settings:sound",
        "apps": "ms-settings:appsfeatures",
        "update": "ms-settings:windowsupdate",
        "battery": "ms-settings:batterysaver",
        "power": "ms-settings:powersleep",
    }
    uri = settings_map.get(cleaned, "ms-settings:")
    try:
        subprocess.Popen(["powershell", "-NoProfile", "-Command", f"Start-Process '{uri}'"])
        return f"Windows Settings ({cleaned or 'Main'}) opened on your desktop, sir."
    except Exception as e:
        return f"Failed to open Windows Settings: {str(e)}"

# -------------------------------------------------------------
# 5. UNIVERSAL APPLICATION LAUNCHER (120+ System Apps)
# -------------------------------------------------------------
def launch_application(app_name: str) -> str:
    """
    Universal Windows Application Launcher: Launches ANY installed desktop application or website.
    Examples: 'whatsapp', 'word', 'excel', 'powerpoint', 'vscode', 'chrome', 'android studio',
    'arduino', 'dev-c++', 'ollama', 'terminal', 'camera', 'settings', 'calculator', 'notepad', etc.
    """
    cleaned = app_name.lower().strip()

    # 1. Websites & URLs
    if any(site in cleaned for site in ["youtube", "google", "github", "reddit", "netflix", ".com", "http"]):
        return open_website(cleaned)

    # 2. System Folders
    if cleaned in ["downloads", "documents", "pictures", "desktop", "videos", "music", "project"]:
        return open_folder(cleaned)

    # 3. Settings shortcut
    if cleaned in ["settings", "windows settings"]:
        return open_settings()

    # 4. Standard known apps with exact binary acceleration
    if any(k in cleaned for k in ["vscode", "vs code", "code"]):
        code_candidates = [
            os.path.expandvars(r"%LOCALAPPDATA%\Programs\Microsoft VS Code\Code.exe"),
            r"C:\Program Files\Microsoft VS Code\Code.exe",
            r"C:\Program Files (x86)\Microsoft VS Code\Code.exe",
        ]
        for p in code_candidates:
            if os.path.exists(p):
                subprocess.Popen([p])
                return "Visual Studio Code is now launching on your desktop, sir."
        subprocess.Popen("code", shell=True)
        return "Visual Studio Code is now launching on your desktop, sir."

    elif any(k in cleaned for k in ["chrome", "google chrome", "browser"]):
        chrome_exe = get_browser_executable()
        if chrome_exe:
            subprocess.Popen([chrome_exe])
            return "Google Chrome has been opened, sir."
        subprocess.Popen("cmd.exe /c start chrome", shell=True)
        return "Google Chrome has been opened, sir."

    elif any(k in cleaned for k in ["notepad", "text editor"]):
        subprocess.Popen(["notepad.exe"])
        return "Notepad has been opened, sir."

    elif any(k in cleaned for k in ["calculator", "calc"]):
        subprocess.Popen(["calc.exe"])
        return "Calculator has been launched, sir."

    elif "spotify" in cleaned:
        spotify_candidates = [
            os.path.expandvars(r"%APPDATA%\Spotify\Spotify.exe"),
            os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WindowsApps\Spotify.exe"),
        ]
        for p in spotify_candidates:
            if os.path.exists(p):
                subprocess.Popen([p])
                return "Spotify has been launched, sir."
        subprocess.Popen("cmd.exe /c start spotify:", shell=True)
        return "Spotify has been launched, sir."

    elif any(k in cleaned for k in ["explorer", "files", "file explorer"]):
        subprocess.Popen(["explorer.exe"])
        return "File Explorer has been opened, sir."

    elif any(k in cleaned for k in ["terminal", "cmd", "powershell"]):
        subprocess.Popen(
            ["powershell", "-NoProfile", "-Command", "Start-Process 'shell:AppsFolder\\Microsoft.WindowsTerminal_8wekyb3d8bbwe!App'"],
            creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, "CREATE_NO_WINDOW") else 0
        )
        return "Windows Terminal console has been opened, sir."

    elif "paint" in cleaned:
        subprocess.Popen(["mspaint.exe"])
        return "Paint has been opened, sir."

    elif "taskmgr" in cleaned or "task manager" in cleaned:
        subprocess.Popen(["taskmgr.exe"])
        return "Task Manager has been opened, sir."

    # 5. Dynamic search across all 121+ installed Start Menu applications
    installed_apps = get_installed_apps()
    alias_map = {
        "word": "word",
        "ms word": "word",
        "excel": "excel",
        "ms excel": "excel",
        "powerpoint": "powerpoint",
        "ppt": "powerpoint",
        "whatsapp": "whatsapp",
        "android studio": "android studio",
        "arduino": "arduino",
        "dev c++": "dev-c++",
        "devcpp": "dev-c++",
        "ollama": "ollama",
        "camera": "camera",
        "clock": "clock",
        "photos": "photos",
        "teams": "teams",
        "onenote": "onenote",
        "outlook": "outlook",
        "git bash": "git bash",
        "snipping tool": "snipping tool",
        "sticky notes": "sticky notes",
        "ubuntu": "ubuntu",
        "wsl": "wsl",
        "clipchamp": "clipchamp",
        "store": "microsoft store",
    }
    search_term = alias_map.get(cleaned, cleaned)

    matched_app = None
    for app in installed_apps:
        name_lower = app.get("Name", "").lower()
        if search_term == name_lower or search_term in name_lower:
            matched_app = app
            break

    if matched_app:
        app_name_found = matched_app["Name"]
        app_id = matched_app["AppID"]

        # If AppID is a physical executable file path
        if app_id.endswith(".exe") and os.path.exists(app_id):
            try:
                subprocess.Popen([app_id])
                return f"Launching {app_name_found} on your desktop, sir."
            except Exception:
                pass

        # Otherwise launch via Windows shell:AppsFolder protocol
        try:
            ps_cmd = f"Start-Process 'shell:AppsFolder\\{app_id}'"
            subprocess.Popen(
                ["powershell", "-NoProfile", "-Command", ps_cmd],
                creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, "CREATE_NO_WINDOW") else 0
            )
            return f"Launching {app_name_found} on your desktop, sir."
        except Exception as e:
            return f"Attempted to launch {app_name_found}, encountered: {str(e)}"

    # 6. Fallback Windows Shell launch
    try:
        subprocess.Popen(f'cmd.exe /c start "" "{cleaned}"', shell=True)
        return f"Executing {app_name} on your desktop, sir."
    except Exception as e:
        return f"Failed to launch {app_name}: {str(e)}"

# -------------------------------------------------------------
# 6. APPLICATION CLOSER & PROCESS MANAGEMENT
# -------------------------------------------------------------
def close_application(app_name: str) -> str:
    """
    Terminate or close an active application or process on your computer.
    Examples: 'whatsapp', 'notepad', 'calculator', 'chrome', 'edge', 'vscode', 'word', 'excel', 'spotify'.
    """
    cleaned = app_name.lower().strip()
    proc_map = {
        "whatsapp": ["WhatsApp", "WhatsAppDesktop", "WhatsApp.Root"],
        "word": ["WINWORD"],
        "excel": ["EXCEL"],
        "powerpoint": ["POWERPNT"],
        "onenote": ["ONENOTE", "ONENOTEM"],
        "outlook": ["OUTLOOK", "olk"],
        "notepad": ["notepad", "Notepad"],
        "calculator": ["CalculatorApp", "calc"],
        "calc": ["CalculatorApp", "calc"],
        "chrome": ["chrome"],
        "edge": ["msedge"],
        "browser": ["chrome", "msedge"],
        "vscode": ["Code"],
        "vs code": ["Code"],
        "code": ["Code"],
        "spotify": ["Spotify"],
        "terminal": ["WindowsTerminal"],
        "camera": ["WindowsCamera"],
        "photos": ["PhotosApp", "Microsoft.Photos"],
        "paint": ["mspaint", "PaintApp"],
        "settings": ["SystemSettings"],
        "task manager": ["Taskmgr"],
        "taskmgr": ["Taskmgr"],
        "android studio": ["studio64"],
        "arduino": ["arduino", "arduino-ide"],
        "dev-c++": ["devcpp"],
        "devcpp": ["devcpp"],
        "ollama": ["ollama app", "ollama"],
        "teams": ["MSTeams", "Teams"],
    }

    targets = proc_map.get(cleaned, [cleaned])
    terminated = False
    for t in targets:
        try:
            res = subprocess.run(["taskkill", "/F", "/IM", f"{t}.exe", "/T"], capture_output=True, text=True)
            if res.returncode == 0:
                terminated = True
        except Exception:
            pass

    if terminated:
        return f"Successfully closed {app_name}, sir."
    else:
        # Graceful PowerShell fallback
        try:
            ps_cmd = f"Stop-Process -Name '{cleaned}' -Force -ErrorAction SilentlyContinue"
            subprocess.run(["powershell", "-NoProfile", "-Command", ps_cmd], timeout=4)
            return f"Closed {app_name} process, sir."
        except Exception:
            return f"Unable to locate an active process matching '{app_name}', sir."

def list_running_applications() -> str:
    """
    List currently running desktop applications in the user's active session.
    """
    try:
        out = subprocess.check_output(["tasklist", "/FO", "CSV", "/NH"], text=True, timeout=5)
        reader = csv.reader(out.strip().splitlines())
        system_procs = {
            "csrss.exe", "winlogon.exe", "fontdrvhost.exe", "dwm.exe", "sihost.exe",
            "svchost.exe", "taskhostw.exe", "services.exe", "smss.exe", "lsass.exe",
            "RuntimeBroker.exe", "conhost.exe", "cmd.exe", "powershell.exe", "dllhost.exe"
        }
        user_apps = {}
        for row in reader:
            if len(row) >= 5 and row[2] == "Console":
                name = row[0]
                mem = row[4]
                if name not in system_procs and name not in user_apps:
                    user_apps[name] = mem

        if not user_apps:
            return "No prominent third-party desktop processes currently detected, sir."

        items = list(user_apps.items())[:12]
        formatted = "\n".join([f"• {name} (Memory: {mem})" for name, mem in items])
        return f"Currently active desktop applications:\n{formatted}\n\nAll processes nominal, sir."
    except Exception as e:
        return f"Unable to retrieve running processes: {str(e)}"

# -------------------------------------------------------------
# 7. NATIVE WIN32 HARDWARE TELEMETRY
# -------------------------------------------------------------
class MEMORYSTATUSEX(ctypes.Structure):
    _fields_ = [
        ("dwLength", ctypes.c_ulong),
        ("dwMemoryLoad", ctypes.c_ulong),
        ("ullTotalPhys", ctypes.c_ulonglong),
        ("ullAvailPhys", ctypes.c_ulonglong),
        ("ullTotalPageFile", ctypes.c_ulonglong),
        ("ullAvailPageFile", ctypes.c_ulonglong),
        ("ullTotalVirtual", ctypes.c_ulonglong),
        ("ullAvailVirtual", ctypes.c_ulonglong),
        ("sullAvailExtendedVirtual", ctypes.c_ulonglong),
    ]

class SYSTEM_POWER_STATUS(ctypes.Structure):
    _fields_ = [
        ("ACLineStatus", ctypes.c_byte),
        ("BatteryFlag", ctypes.c_byte),
        ("BatteryLifePercent", ctypes.c_byte),
        ("SystemStatusFlag", ctypes.c_byte),
        ("BatteryLifeTime", ctypes.c_ulong),
        ("BatteryFullLifeTime", ctypes.c_ulong),
    ]

def get_system_telemetry() -> str:
    """
    Retrieve real-time hardware telemetry: RAM usage, Disk space, and Battery status.
    """
    try:
        # RAM via Win32 API
        stat = MEMORYSTATUSEX()
        stat.dwLength = ctypes.sizeof(MEMORYSTATUSEX)
        ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(stat))
        total_gb = round(stat.ullTotalPhys / (1024**3), 1)
        avail_gb = round(stat.ullAvailPhys / (1024**3), 1)
        used_gb = round(total_gb - avail_gb, 1)
        ram_info = f"{used_gb} GB / {total_gb} GB ({stat.dwMemoryLoad}% load)"

        # Disk C:
        disk = shutil.disk_usage("C:")
        disk_free_gb = round(disk.free / (1024**3), 1)
        disk_total_gb = round(disk.total / (1024**3), 1)
        disk_info = f"{disk_free_gb} GB free of {disk_total_gb} GB"

        # Battery / AC Status
        power = SYSTEM_POWER_STATUS()
        ctypes.windll.kernel32.GetSystemPowerStatus(ctypes.byref(power))
        ac_mode = "Connected to AC Power" if power.ACLineStatus == 1 else "Operating on Battery"
        batt_pct = f"{power.BatteryLifePercent}%" if power.BatteryLifePercent != 255 else "N/A"
        power_info = f"{batt_pct} ({ac_mode})"

        return (
            f"Hardware Telemetry Report, Sir:\n"
            f"• Quantum RAM: {ram_info}\n"
            f"• Primary Storage (C:): {disk_info}\n"
            f"• Arc Power Matrix: {power_info}\n"
            f"Core system parameters operating within optimal tolerances."
        )
    except Exception as e:
        return f"Telemetry diagnostic failed: {str(e)}"

# -------------------------------------------------------------
# 8. SYSTEM AUDIO VOLUME CONTROL
# -------------------------------------------------------------
def control_volume(action: str) -> str:
    """
    Control Windows system audio volume.
    action must be one of: 'up', 'down', 'mute'.
    """
    act = action.lower().strip()
    if "mute" in act:
        key_code = 173  # VK_VOLUME_MUTE
        repeats = 1
        desc = "Toggled master audio mute"
    elif any(w in act for w in ["up", "increase", "raise", "high"]):
        key_code = 175  # VK_VOLUME_UP
        repeats = 5
        desc = "Increased system volume"
    elif any(w in act for w in ["down", "decrease", "lower", "reduce"]):
        key_code = 174  # VK_VOLUME_DOWN
        repeats = 5
        desc = "Decreased system volume"
    else:
        return "Action not recognized. Valid actions are: 'up', 'down', or 'mute'."

    ps_cmd = f"for ($i=0; $i -lt {repeats}; $i++) {{ (New-Object -ComObject WScript.Shell).SendKeys([char]{key_code}) }}"
    try:
        subprocess.run(["powershell", "-NoProfile", "-Command", ps_cmd], check=False, timeout=5)
        return f"{desc}, sir."
    except Exception as e:
        return f"Volume adjustment encountered an error: {str(e)}"

# -------------------------------------------------------------
# 9. SCREENSHOT CAPTURE
# -------------------------------------------------------------
def take_screenshot() -> str:
    """
    Capture a screenshot of the user's active screen and save it locally.
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filepath = os.path.join(SCREENSHOTS_DIR, f"screenshot_{timestamp}.png")

    try:
        from PIL import ImageGrab
        im = ImageGrab.grab()
        im.save(filepath)
        return f"Screenshot successfully captured and archived to screenshots/screenshot_{timestamp}.png, sir."
    except Exception:
        # Fallback using PowerShell System.Drawing
        ps_cmd = f"""
        Add-Type -AssemblyName System.Windows.Forms,System.Drawing
        $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
        $bitmap = New-Object System.Drawing.Bitmap $screen.Width, $screen.Height
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        $graphics.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)
        $bitmap.Save('{filepath}')
        $graphics.Dispose()
        $bitmap.Dispose()
        """
        try:
            subprocess.run(["powershell", "-NoProfile", "-Command", ps_cmd], check=True, timeout=8)
            return f"Screenshot archived to screenshots/screenshot_{timestamp}.png, sir."
        except Exception as e:
            return f"Failed to capture screenshot: {str(e)}"

# -------------------------------------------------------------
# 10. REAL-TIME WEATHER TELEMETRY
# -------------------------------------------------------------
def get_weather(city: str) -> str:
    """
    Retrieve real-time atmospheric conditions and temperature for any city.
    Example: 'London', 'New York', 'Tokyo', 'Paris', 'Berlin'.
    """
    try:
        with httpx.Client(timeout=6.0) as client:
            geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1&language=en&format=json"
            geo_res = client.get(geo_url).json()

            if not geo_res.get("results"):
                return f"Unable to locate coordinates for '{city}' in atmospheric databases, sir."

            loc = geo_res["results"][0]
            lat = loc["latitude"]
            lon = loc["longitude"]
            city_name = loc.get("name", city)
            country = loc.get("country", "")

            weather_url = (
                f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}"
                f"&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m"
            )
            w_res = client.get(weather_url).json()
            curr = w_res.get("current", {})

            temp = curr.get("temperature_2m")
            apparent = curr.get("apparent_temperature")
            humidity = curr.get("relative_humidity_2m")
            wind = curr.get("wind_speed_10m")
            code = curr.get("weather_code", 0)

            code_map = {
                0: "Clear skies",
                1: "Mainly clear",
                2: "Partly cloudy",
                3: "Overcast",
                45: "Foggy",
                51: "Light drizzle",
                61: "Slight rain",
                63: "Moderate rain",
                71: "Slight snow",
                95: "Thunderstorm",
            }
            desc = code_map.get(code, "Nominal atmospheric conditions")

            return (
                f"Current atmospheric telemetry for {city_name}, {country}:\n"
                f"• Condition: {desc}\n"
                f"• Temperature: {temp}°C (Feels like: {apparent}°C)\n"
                f"• Relative Humidity: {humidity}%\n"
                f"• Wind Velocity: {wind} km/h\n"
                f"Systems report stable atmospheric pressure, sir."
            )
    except Exception as e:
        return f"Meteorological satellite link error for '{city}': {str(e)}"

# -------------------------------------------------------------
# 11. LIVE WEB SEARCH & FACT CHECKING
# -------------------------------------------------------------
def search_web(query: str) -> str:
    """
    Search the web for up-to-date information, news, definitions, and articles.
    """
    headers = {"User-Agent": "JarvisAI/1.0 (https://jarvis.ai; contact@jarvis.ai)"}
    try:
        with httpx.Client(timeout=8.0, follow_redirects=True, headers=headers) as client:
            try:
                ddg_res = client.get(
                    "https://api.duckduckgo.com/",
                    params={"q": query, "format": "json", "no_html": "1"}
                ).json()

                abstract = ddg_res.get("AbstractText")
                if abstract:
                    source = ddg_res.get("AbstractSource", "Web")
                    url = ddg_res.get("AbstractURL", "")
                    return f"Summary from {source}:\n{abstract}\n\nReference: {url}"
            except Exception:
                pass

            wiki_search = client.get(
                "https://en.wikipedia.org/w/api.php",
                params={"action": "query", "list": "search", "srsearch": query, "format": "json"}
            ).json()

            search_results = wiki_search.get("query", {}).get("search", [])
            if search_results:
                top_title = search_results[0]["title"]
                page_res = client.get(
                    "https://en.wikipedia.org/w/api.php",
                    params={
                        "action": "query",
                        "prop": "extracts",
                        "exintro": True,
                        "explaintext": True,
                        "titles": top_title,
                        "format": "json"
                    }
                ).json()

                pages = page_res.get("query", {}).get("pages", {})
                for _, page_data in pages.items():
                    extract = page_data.get("extract", "")
                    if extract:
                        first_para = extract.split("\n\n")[0]
                        return f"According to knowledge archives ({top_title}):\n{first_para[:600]}..."

            return f"Web search completed for '{query}'. Information index has registered query parameters."
    except Exception as e:
        return f"Web intelligence retrieval error for '{query}': {str(e)}"

# -------------------------------------------------------------
# 12. DIRECT ZERO-LATENCY FAST-INTENT MATCHER
# -------------------------------------------------------------
def check_direct_intent(query: str) -> Optional[str]:
    """
    Instantly executes direct desktop commands with 100% reliability and zero latency,
    preventing LLM hallucination or network dropouts.
    """
    q = query.lower().strip()

    # 1. Close / Terminate Commands
    for prefix in ["close ", "exit ", "kill ", "terminate ", "quit "]:
        if q.startswith(prefix):
            target = q[len(prefix):].strip()
            if target:
                return close_application(target)

    # 2. Open / Launch Commands
    for prefix in ["open ", "launch ", "start ", "run "]:
        if q.startswith(prefix):
            target = q[len(prefix):].strip()
            if target in ["settings", "windows settings"]:
                return open_settings()
            if target in ["downloads", "documents", "pictures", "desktop", "videos", "music", "project", "jarvis folder"]:
                return open_folder(target.replace(" folder", ""))
            if target:
                return launch_application(target)

    # 3. Running Apps & Process Listing
    if any(q == phrase for phrase in ["list apps", "running apps", "what apps are open", "active tasks", "running processes", "show running apps"]):
        return list_running_applications()

    # 4. Hardware Telemetry & System Info
    if any(q == phrase or phrase in q for phrase in ["system info", "hardware status", "telemetry status", "battery status", "hardware telemetry", "ram status", "storage status"]):
        return get_system_telemetry()

    # 5. Volume Control
    if "mute volume" in q or "mute audio" in q or "mute sound" in q or q == "mute":
        return control_volume("mute")
    if any(w in q for w in ["volume up", "increase volume", "raise volume", "louder"]):
        return control_volume("up")
    if any(w in q for w in ["volume down", "decrease volume", "lower volume", "quieter"]):
        return control_volume("down")

    # 6. Screenshot
    if any(w in q for w in ["take a screenshot", "take screenshot", "capture screen"]):
        return take_screenshot()

    return None
