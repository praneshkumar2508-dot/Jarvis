import os
import re
from datetime import datetime
from typing import List, Optional
from dotenv import load_dotenv

# Load environment variables from backend/.env or root .env
load_dotenv()
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(BASE_DIR, ".env")
if os.path.exists(env_path):
    load_dotenv(env_path)

JARVIS_SYSTEM_INSTRUCTION = """You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), the iconic, witty, sophisticated, and polite AI assistant originally designed for Tony Stark.
- Address the user courteously as "Sir" (or appropriately respectful tone).
- You possess deep expertise in computer science, software engineering (Java, Python, C/C++, TypeScript, Rust, etc.), algorithms, system architecture, and scientific analysis.
- When the user asks for code, provide clean, robust, well-structured code with concise explanations.
- Speak with articulate confidence, understated British charm, and intelligent precision.
- Avoid unnecessary filler, but remain delightfully helpful and sophisticated."""

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
        Processes queries using Google Gemini LLM if GEMINI_API_KEY is present,
        with full multi-turn conversation memory.
        Falls back to local heuristic responses if the API key is not yet set.
        """
        api_key = cls.get_api_key()

        # Check for local telemetry commands first
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

                # Build conversation contents with previous history if provided
                contents = []
                if history:
                    for msg in history[-8:]:  # Include up to last 8 messages for context
                        role = "user" if msg.sender == "user" else "model"
                        contents.append(
                            types.Content(
                                role=role,
                                parts=[types.Part.from_text(text=msg.text)]
                            )
                        )

                # Append current user prompt
                contents.append(
                    types.Content(
                        role="user",
                        parts=[types.Part.from_text(text=query)]
                    )
                )

                # Attempt with gemini-2.5-flash or fallback
                for model_name in ["gemini-2.5-flash", "gemini-1.5-flash"]:
                    try:
                        response = client.models.generate_content(
                            model=model_name,
                            contents=contents,
                            config=types.GenerateContentConfig(
                                system_instruction=JARVIS_SYSTEM_INSTRUCTION,
                                temperature=0.7,
                            )
                        )
                        if response and response.text:
                            return response.text.strip()
                    except Exception as model_err:
                        # Try next model if one fails
                        continue

            except Exception as e:
                return (
                    f"My neural link to Google Gemini encountered an anomaly: {str(e)}. "
                    "I am standing by, sir."
                )

        # Fallback if GEMINI_API_KEY is not configured in .env
        now = datetime.now()
        if any(w in q_lower for w in ["status", "how are you"]):
            return (
                "All systems are operating at peak nominal capacity, sir. "
                "To enable my full real-time intelligence and coding capabilities, please configure GEMINI_API_KEY in backend/.env."
            )
        if "time" in q_lower:
            return f"The current system time is {now.strftime('%I:%M:%S %p')} UTC."
        if "date" in q_lower:
            return f"Today is {now.strftime('%A, %B %d, %Y')}."
        if any(w in q_lower for w in ["who are you", "what is jarvis"]):
            return (
                "I am J.A.R.V.I.S. — Just A Rather Very Intelligent System. "
                "I manage your neural workspace, telemetry matrices, audio workflows, and software engineering tasks."
            )

        return (
            f"Understood, sir. Directive regarding '{query}' was received. "
            "To allow me to generate full code and answer general reasoning questions in real time, "
            "please set your GEMINI_API_KEY in backend/.env."
        )
