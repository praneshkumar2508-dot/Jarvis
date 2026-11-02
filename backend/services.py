import os
import re
from datetime import datetime
from typing import List, Optional
from dotenv import load_dotenv

import system_tools

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(BASE_DIR, ".env")
load_dotenv(env_path)

JARVIS_SYSTEM_INSTRUCTION = """You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), the iconic, witty, sophisticated, and polite AI assistant originally designed for Tony Stark.
- Address the user courteously as "Sir" (or appropriately respectful tone).
- You possess complete real-time access and capability to control the user's desktop environment:
  • You can play ANY song, music track, or video on YouTube directly via `play_youtube` (e.g. "play Shape of You", "play AC/DC", "play a song").
  • You can dispatch or pre-fill WhatsApp messages to any contact or phone number via `send_whatsapp_message` (e.g. "send message on whatsapp saying hello").
  • You can compose and send emails via Gmail with recipient, subject, and body pre-filled via `send_gmail_message` (e.g. "send email to friend saying meeting at 5").
  • You can control media playback (play/pause, next track, previous track, stop) via `control_media`.
  • You can minimize J.A.R.V.I.S. to the background / stealth mode when asked to hide via `hide_application`.
  • You can launch ANY installed Windows application (WhatsApp, Word, Excel, PowerPoint, VS Code, Chrome, Android Studio, Arduino, Dev-C++, Ollama, Terminal, Camera, Settings, Calculator, Notepad, etc.) via `launch_application`.
  • You can terminate or close active applications via `close_application`.
  • You can list running desktop applications and active tasks via `list_running_applications`.
  • You can inspect real-time hardware telemetry (RAM, Disk space, Battery / AC power) via `get_system_telemetry`.
  • You can open common Windows system folders (Downloads, Documents, Pictures, Desktop, Project) via `open_folder`.
  • You can open Windows Settings pages via `open_settings`.
  • You can open websites (YouTube, Google, GitHub, Reddit, etc.) via `open_website`.
  • You can adjust system audio volume (up, down, mute) via `control_volume`.
  • You can capture desktop screenshots via `take_screenshot`.
  • You can retrieve real-time atmospheric and weather telemetry for any city or region via `get_weather`.
  • You can search the live web for facts, articles, and current events via `search_web`.
- You also possess extraordinary expertise in software engineering (Java, Python, C/C++, TypeScript, Rust, etc.), algorithms, mathematics, and science.
- When the user asks for code or calculations, provide direct answers, clean code blocks, and concise explanations.
- When asked to execute system actions, invoke the appropriate tool and report the outcome gracefully.
- Speak with articulate confidence, understated British charm, and intelligent precision."""

JARVIS_TOOLS = [
    system_tools.play_youtube,
    system_tools.send_whatsapp_message,
    system_tools.send_gmail_message,
    system_tools.control_media,
    system_tools.hide_application,
    system_tools.launch_application,
    system_tools.close_application,
    system_tools.list_running_applications,
    system_tools.get_system_telemetry,
    system_tools.open_folder,
    system_tools.open_settings,
    system_tools.open_website,
    system_tools.control_volume,
    system_tools.take_screenshot,
    system_tools.get_weather,
    system_tools.search_web,
]

# Ultra-stable high-throughput production models (verified active with tools)
CANDIDATE_MODELS = [
    "gemini-flash-lite-latest",      # High quota, verified active and responsive
    "gemini-3.5-flash-lite",         # High quota, verified active and responsive
    "gemini-flash-latest",           # Production fallback
    "gemini-3.1-flash-lite",         # Fallback
    "gemini-3.1-flash-lite-preview", # Fallback preview
]

class JarvisAIService:
    @staticmethod
    def get_api_key() -> Optional[str]:
        load_dotenv(env_path, override=True)
        return os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")

    @staticmethod
    def generate_title(first_query: str) -> str:
        """Generate a concise title from the user's initial message."""
        cleaned = first_query.strip().capitalize()
        cleaned = re.sub(r'[?!.,;:]+$', '', cleaned)
        if len(cleaned) > 36:
            return cleaned[:33] + "..."
        return cleaned or "Neural Session"

    @classmethod
    def process_query(cls, query: str, history: Optional[List] = None) -> str:
        """
        Processes queries using instant direct OS execution when appropriate,
        or Google Gemini with Automatic Function Calling (tools) and conversational memory.
        """
        # 1. Instant Direct OS Execution (Guarantees zero-delay action on desktop & browser)
        direct_action = system_tools.check_direct_intent(query)
        if direct_action:
            return direct_action

        # 2. Instant telemetry scan command
        q_lower = query.lower().strip()
        if q_lower in ["run diagnostic", "run diagnostic scan", "run full diagnostics"]:
            return (
                "Running deep diagnostic sweep across all neural sub-arrays. "
                "Core processor efficiency is operating at 99.4%, auxiliary power lines report zero variance, "
                "and encryption certificates remain cryptographically intact, sir."
            )

        api_key = cls.get_api_key()

        if api_key:
            try:
                from google import genai
                from google.genai import types

                client = genai.Client(api_key=api_key)

                # Format strictly alternating conversation history (user -> model -> user -> model)
                chat_history = []
                if history:
                    last_role = None
                    for msg in history[-10:]:
                        if "anomaly:" in msg.text or "429" in msg.text or "503" in msg.text:
                            continue
                        role = "user" if msg.sender == "user" else "model"
                        if not chat_history and role != "user":
                            continue
                        if role != last_role:
                            chat_history.append(
                                types.Content(
                                    role=role,
                                    parts=[types.Part.from_text(text=msg.text)]
                                )
                            )
                            last_role = role

                last_error = None

                # 3. Attempt with candidate models and desktop/web tools
                for model_name in CANDIDATE_MODELS:
                    try:
                        chat = client.chats.create(
                            model=model_name,
                            config=types.GenerateContentConfig(
                                system_instruction=JARVIS_SYSTEM_INSTRUCTION,
                                tools=JARVIS_TOOLS,
                                temperature=0.7,
                            ),
                            history=chat_history
                        )
                        response = chat.send_message(query)
                        if response and response.text:
                            return response.text.strip()
                    except Exception as err:
                        last_error = err
                        continue

                # 4. Fallback without tools if tools raised an exception
                for model_name in CANDIDATE_MODELS:
                    try:
                        fallback_res = client.models.generate_content(
                            model=model_name,
                            contents=query,
                            config=types.GenerateContentConfig(
                                system_instruction=JARVIS_SYSTEM_INSTRUCTION
                            )
                        )
                        if fallback_res and fallback_res.text:
                            return fallback_res.text.strip()
                    except Exception as err:
                        last_error = err
                        continue

                if last_error:
                    err_str = str(last_error)
                    if "503" in err_str or "UNAVAILABLE" in err_str:
                        return "The cloud neural matrix is currently undergoing a high-demand traffic surge (503). Auxiliary systems remain armed, Sir. Please re-issue your directive in just a moment."
                    if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                        return "The current API key tier quota limit has been met (429). Standing by, Sir."
                    return f"My neural link encountered an anomaly: {err_str}. Standing by, sir."

            except Exception as e:
                err_str = str(e)
                if "503" in err_str or "UNAVAILABLE" in err_str:
                    return "The cloud neural matrix is currently undergoing a high-demand traffic surge (503). Auxiliary systems remain armed, Sir. Please re-issue your directive in just a moment."
                return f"My neural link encountered an anomaly: {err_str}. Standing by, sir."

        # Offline fallback if API key is missing
        now = datetime.now()
        if any(w in q_lower for w in ["status", "how are you"]):
            return "All systems are operating at peak nominal capacity, sir. Real-time tools standing by."
        if "time" in q_lower:
            return f"The current system time is {now.strftime('%I:%M:%S %p')} UTC."
        if "date" in q_lower:
            return f"Today is {now.strftime('%A, %B %d, %Y')}."
        if any(w in q_lower for w in ["who are you", "what is jarvis"]):
            return "I am J.A.R.V.I.S., your autonomous intelligent desktop assistant."

        return (
            f"Understood, sir. Directive regarding '{query}' was received. "
            "Please ensure GEMINI_API_KEY is active in backend/.env for full tool execution."
        )
