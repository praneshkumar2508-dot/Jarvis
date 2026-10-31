import re
from datetime import datetime

class JarvisAIService:
    @staticmethod
    def generate_title(first_query: str) -> str:
        """Generate a concise title from the user's initial message."""
        cleaned = first_query.strip().capitalize()
        # Remove trailing punctuation
        cleaned = re.sub(r'[?!.,;:]+$', '', cleaned)
        if len(cleaned) > 36:
            return cleaned[:33] + "..."
        return cleaned or "Neural Session"

    @staticmethod
    def process_query(query: str) -> str:
        """
        Processes queries with intelligent reasoning, system telemetry understanding,
        and authentic Jarvis persona responses.
        """
        q = query.lower().strip()
        now = datetime.now()

        # 1. Diagnostic / Scan queries
        if any(w in q for w in ["diagnostic", "scan", "system check", "health check"]):
            return (
                "Running deep diagnostic sweep across all neural sub-arrays. "
                "Core processor efficiency is operating at 99.4%, auxiliary power lines report zero variance, "
                "and encryption certificates remain cryptographically intact, sir."
            )

        # 2. Status / Readiness
        if any(w in q for w in ["status", "how are you", "operational", "standby"]):
            return (
                "All systems are operating at peak nominal capacity, sir. "
                "Stark Net neural synchronization is stable, audio telemetry bus is clear, "
                "and internal diagnostics detect no anomalies."
            )

        # 3. Time / Date
        if "time" in q:
            return f"The current system time is {now.strftime('%I:%M:%S %p')} UTC."
        if "date" in q or "today" in q:
            return f"Today is {now.strftime('%A, %B %d, %Y')}."

        # 4. Identity / Who are you
        if any(w in q for w in ["who are you", "what is jarvis", "your name"]):
            return (
                "I am J.A.R.V.I.S. — Just A Rather Very Intelligent System. "
                "I oversee your neural workspace, telemetry matrices, audio workflows, and system operations."
            )

        # 5. Arc Reactor / Power
        if any(w in q for w in ["reactor", "arc power", "battery", "energy"]):
            return (
                "The central Arc Reactor is operating at 98% nominal output, discharging 3.2 gigajoules "
                "per second with thermal stabilization within tolerance boundaries."
            )

        # 6. Security / Defense
        if any(w in q for w in ["security", "protocol", "lockdown", "defense", "firewall"]):
            return (
                "Level four quantum firewall protocols are fully engaged. External network ports are isolated, "
                "and encrypted perimeter surveillance is actively scanning for unauthorized intrusions, sir."
            )

        # 7. Greetings
        if any(q.startswith(w) for w in ["hello", "hi", "hey", "good morning", "good evening", "good afternoon"]):
            return "Good day, sir. J.A.R.V.I.S. is at your disposal. What directive shall we execute next?"

        # 8. Help / Capabilities
        if any(w in q for w in ["help", "what can you do", "features"]):
            return (
                "I am equipped to manage conversational threads, log audio telemetry, run hardware diagnostics, "
                "switch visual HUD frequency matrices, and manage persistent neural sessions in the database. "
                "How may I assist you today, sir?"
            )

        # 9. General Intelligent Fallback
        return (
            f"Understood, sir. Directive regarding '{query}' has been logged into the neural matrix. "
            "Data buffers have processed your request and stand ready for subsequent commands."
        )
