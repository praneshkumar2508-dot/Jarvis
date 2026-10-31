import os
import subprocess
import webbrowser
from datetime import datetime
from typing import Optional
import httpx

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCREENSHOTS_DIR = os.path.join(BASE_DIR, "screenshots")
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

# -------------------------------------------------------------
# 1. APPLICATION & WEBSITE LAUNCHER
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

    # Physical OS-level execution:
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


def launch_application(app_name: str) -> str:
    """
    Launch a desktop application or website on the user's computer.
    Examples: 'vscode', 'chrome', 'notepad', 'calculator', 'spotify', 'youtube', 'explorer', 'paint', 'terminal'.
    """
    cleaned = app_name.lower().strip()

    # Check for websites first
    if any(site in cleaned for site in ["youtube", "google", "github", "reddit", "netflix", ".com", "http"]):
        return open_website(cleaned)

    # Desktop apps:
    # Visual Studio Code
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

    # Google Chrome
    elif any(k in cleaned for k in ["chrome", "browser"]):
        chrome_exe = get_browser_executable()
        if chrome_exe:
            subprocess.Popen([chrome_exe])
            return "Google Chrome has been opened, sir."
        subprocess.Popen("cmd.exe /c start chrome", shell=True)
        return "Google Chrome has been opened, sir."

    # Notepad
    elif any(k in cleaned for k in ["notepad", "text editor"]):
        subprocess.Popen(["notepad.exe"])
        return "Notepad has been opened, sir."

    # Calculator
    elif any(k in cleaned for k in ["calculator", "calc"]):
        subprocess.Popen(["calc.exe"])
        return "Calculator has been launched, sir."

    # Spotify
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

    # File Explorer
    elif any(k in cleaned for k in ["explorer", "files", "folder"]):
        subprocess.Popen(["explorer.exe"])
        return "File Explorer has been opened, sir."

    # Terminal
    elif any(k in cleaned for k in ["terminal", "cmd", "powershell"]):
        subprocess.Popen("start wt || start powershell || start cmd", shell=True)
        return "Terminal console has been opened, sir."

    # Paint
    elif "paint" in cleaned:
        subprocess.Popen(["mspaint.exe"])
        return "Paint has been opened, sir."

    # Task Manager
    elif "taskmgr" in cleaned or "task manager" in cleaned:
        subprocess.Popen(["taskmgr.exe"])
        return "Task Manager has been opened, sir."

    else:
        try:
            subprocess.Popen(f'cmd.exe /c start "" "{cleaned}"', shell=True)
            return f"Executing {app_name} on your desktop, sir."
        except Exception as e:
            return f"Failed to launch {app_name}: {str(e)}"

# -------------------------------------------------------------
# 2. SYSTEM AUDIO VOLUME CONTROL
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
# 3. SCREENSHOT CAPTURE
# -------------------------------------------------------------
def take_screenshot() -> str:
    """
    Capture a screenshot of the user's desktop display and save it to the screenshots archive.
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"screenshot_{timestamp}.png"
    filepath = os.path.join(SCREENSHOTS_DIR, filename)

    ps_cmd = f"""
    Add-Type -AssemblyName System.Windows.Forms,System.Drawing
    $b = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
    $bmp = New-Object System.Drawing.Bitmap $b.Width, $b.Height
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.CopyFromScreen($b.Location, [System.Drawing.Point]::Empty, $b.Size)
    $bmp.Save('{filepath}')
    """
    try:
        subprocess.run(["powershell", "-NoProfile", "-Command", ps_cmd], check=False, timeout=8)
        if os.path.exists(filepath):
            return f"Display screenshot captured and archived to backend/screenshots/{filename}, sir."
        return "Screenshot capture command executed, but file output could not be verified."
    except Exception as e:
        return f"Screenshot capture failed: {str(e)}"

# -------------------------------------------------------------
# 4. REAL-TIME WEATHER TELEMETRY
# -------------------------------------------------------------
WEATHER_CODES = {
    0: "Clear skies",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
}

def get_weather(city: str = "London") -> str:
    """
    Get live, real-time weather telemetry for any city or region.
    """
    try:
        with httpx.Client(timeout=6.0) as client:
            geo_res = client.get(
                "https://geocoding-api.open-meteo.com/v1/search",
                params={"name": city, "count": 1}
            ).json()

            if not geo_res.get("results"):
                return f"Could not locate geographic coordinates for '{city}', sir."

            loc = geo_res["results"][0]
            lat = loc["latitude"]
            lon = loc["longitude"]
            city_name = loc.get("name", city)
            country = loc.get("country", "")

            weather_res = client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "current": "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m"
                }
            ).json()

            current = weather_res.get("current", {})
            temp = current.get("temperature_2m", "N/A")
            feels = current.get("apparent_temperature", "N/A")
            humidity = current.get("relative_humidity_2m", "N/A")
            wind = current.get("wind_speed_10m", "N/A")
            w_code = current.get("weather_code", 0)
            condition = WEATHER_CODES.get(w_code, "Fair")

            return (
                f"Live atmospheric telemetry for {city_name}, {country}:\n"
                f"• Condition: {condition}\n"
                f"• Temperature: {temp}°C (Feels like: {feels}°C)\n"
                f"• Relative Humidity: {humidity}%\n"
                f"• Wind Speed: {wind} km/h"
            )
    except Exception as e:
        return f"Atmospheric sensor link error for '{city}': {str(e)}"

# -------------------------------------------------------------
# 5. LIVE WEB SEARCH & FACT CHECKING
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
# 6. DIRECT FAST-INTENT MATCHER
# -------------------------------------------------------------
def check_direct_intent(query: str) -> Optional[str]:
    """
    Instantly executes direct desktop commands with 100% reliability and zero latency,
    preventing LLM hallucination or network dropouts.
    """
    q = query.lower().strip()

    # Websites
    if any(q.startswith(w) for w in ["open youtube", "launch youtube"]):
        return open_website("youtube")
    if any(q.startswith(w) for w in ["open google", "launch google"]):
        return open_website("google")
    if any(q.startswith(w) for w in ["open github", "launch github"]):
        return open_website("github")

    # Desktop Apps
    if any(q == w or q.startswith(w) for w in ["open vscode", "open vs code", "launch vscode", "launch vs code", "open code", "launch code"]):
        return launch_application("vscode")
    if any(q == w or q.startswith(w) for w in ["open notepad", "launch notepad"]):
        return launch_application("notepad")
    if any(q == w or q.startswith(w) for w in ["open calculator", "launch calculator", "open calc", "launch calc"]):
        return launch_application("calculator")
    if any(q == w or q.startswith(w) for w in ["open spotify", "launch spotify"]):
        return launch_application("spotify")
    if any(q == w or q.startswith(w) for w in ["open chrome", "launch chrome", "open browser"]):
        return launch_application("chrome")
    if any(q == w or q.startswith(w) for w in ["open explorer", "open file explorer", "open files"]):
        return launch_application("explorer")
    if any(q == w or q.startswith(w) for w in ["open terminal", "open cmd", "open powershell"]):
        return launch_application("terminal")
    if any(q == w or q.startswith(w) for w in ["open paint", "launch paint"]):
        return launch_application("paint")
    if any(q == w or q.startswith(w) for w in ["open task manager", "launch task manager", "open taskmgr"]):
        return launch_application("taskmgr")

    # Volume Control
    if "mute volume" in q or "mute audio" in q or "mute sound" in q:
        return control_volume("mute")
    if any(w in q for w in ["volume up", "increase volume", "raise volume"]):
        return control_volume("up")
    if any(w in q for w in ["volume down", "decrease volume", "lower volume"]):
        return control_volume("down")

    # Screenshot
    if any(w in q for w in ["take a screenshot", "take screenshot", "capture screen"]):
        return take_screenshot()

    return None
