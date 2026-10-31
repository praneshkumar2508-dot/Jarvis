import os
import subprocess
from datetime import datetime
from typing import Optional
import httpx

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCREENSHOTS_DIR = os.path.join(BASE_DIR, "screenshots")
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

# -------------------------------------------------------------
# 1. APPLICATION LAUNCHER
# -------------------------------------------------------------
APP_COMMANDS = {
    "chrome": "start chrome",
    "google chrome": "start chrome",
    "browser": "start chrome",
    "notepad": "notepad",
    "text editor": "notepad",
    "calculator": "calc",
    "calc": "calc",
    "code": "code",
    "vscode": "code",
    "vs code": "code",
    "spotify": "start spotify:",
    "music": "start spotify:",
    "explorer": "explorer",
    "file explorer": "explorer",
    "files": "explorer",
    "paint": "mspaint",
    "mspaint": "mspaint",
    "terminal": "start wt",
    "cmd": "start cmd",
    "powershell": "start powershell",
    "task manager": "taskmgr",
    "taskmgr": "taskmgr",
}

def launch_application(app_name: str) -> str:
    """
    Launch a desktop application on the user's computer.
    Examples of app_name: 'chrome', 'notepad', 'calculator', 'vscode', 'spotify', 'explorer', 'paint', 'terminal'.
    """
    cleaned = app_name.lower().strip()
    cmd = APP_COMMANDS.get(cleaned, f"start {cleaned}")

    try:
        subprocess.Popen(cmd, shell=True)
        return f"Initiated execution for {app_name}. Application is now running on your desktop, sir."
    except Exception as e:
        return f"Unable to launch {app_name}: {str(e)}"

# -------------------------------------------------------------
# 2. SYSTEM AUDIO VOLUME CONTROL
# -------------------------------------------------------------
def control_volume(action: str) -> str:
    """
    Control Windows system audio volume.
    action must be one of:
      - 'up' or 'increase' (turns volume up)
      - 'down' or 'decrease' (turns volume down)
      - 'mute' (toggles master audio mute)
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
        return f"Volume adjustment encounter an error: {str(e)}"

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
    Example: city='Chennai', 'New York', 'Tokyo', 'London', 'San Francisco'.
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
            # 1. Try DuckDuckGo Instant Answer
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

            # 2. Try Wikipedia Search
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
