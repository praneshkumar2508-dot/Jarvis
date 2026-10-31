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
- You possess real-time capability to control the user's desktop environment:
  • You can launch applications (Chrome, VS Code, Notepad, Spotify, Calculator, Terminal, File Explorer, Paint, etc.) via `launch_application`.
  • You can adjust system audio volume (up, down, mute) via `control_volume`.
  • You can capture desktop screenshots via `take_screenshot`.
  • You can retrieve real-time atmospheric and weather telemetry for any city or region via `get_weather`.
  • You can search the live web for facts, articles, and current events via `search_web`.
- You also possess extraordinary expertise in software engineering (Java, Python, C/C++, TypeScript, Rust, etc.), algorithms, mathematics, and science.
- When the user asks for code, provide clean, robust, well-structured code blocks with concise explanations.
- When asked to execute system actions (e.g., "open notepad", "mute volume", "take a screenshot", "what's the weather in Tokyo?"), invoke the appropriate tool and report the outcome gracefully.
- Speak with articulate confidence, understated British charm, and intelligent precision."""

JARVIS_TOOLS = [
    system_tools.launch_application,
    system_tools.control_volume,
    system_tools.take_screenshot,
    system_tools.get_weather,
    system_tools.search_web,
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
        Processes queries using Google Gemini with Automatic Function Calling (tools)
        and conversational memory.
        """
        api_key = cls.get_api_key()

        # Hardcoded instant telemetry command
        q_lower = query.lower().strip()
        if q_lower in ["run diagnostic", "run diagnostic scan", "run full diagnostics"]:
            return (
                "Running deep diagnostic sweep across all neural sub-arrays. "
                "Core processor efficiency is operating at 99.4%, auxiliary power lines report zero variance, "
                "and encryption certificates remain cryptographically intact, sir."
            )

        if api_key:
            try:
                from google import genai
                from google.genai import types

                client = genai.Client(api_key=api_key)

                # Format conversation history
                chat_history = []
                if history:
                    for msg in history[-8:]:
                        role = "user" if msg.sender == "user" else "model"
                        chat_history.append(
                            types.Content(
                                role=role,
                                parts=[types.Part.from_text(text=msg.text)]
                            )
                        )

                # Create chat session with full desktop & web tools
                chat = client.chats.create(
                    model="gemini-2.5-flash",
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

            except Exception as e:
                # If error, try fallback without tools or report cleanly
                try:
                    from google import genai
                    from google.genai import types
                    client = genai.Client(api_key=api_key)
                    fallback_res = client.models.generate_content(
                        model="gemini-2.5-flash",
                        contents=query,
                        config=types.GenerateContentConfig(system_instruction=JARVIS_SYSTEM_INSTRUCTION)
                    )
                    if fallback_res and fallback_res.text:
                        return fallback_res.text.strip()
                except Exception as inner_e:
                    return f"My neural link encountered an anomaly: {str(inner_e)}. Standing by, sir."

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
