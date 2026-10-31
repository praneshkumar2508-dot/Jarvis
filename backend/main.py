from datetime import datetime
from typing import List
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import engine, Base, get_db
import models
import schemas
from services import JarvisAIService

# Initialize tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="J.A.R.V.I.S. Neural Core API",
    description="Backend AI service, conversation database, and telemetry hub for Jarvis",
    version="1.0.0"
)

# Enable CORS for frontend Vite app (localhost:5173, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "system": "J.A.R.V.I.S. Neural Core",
        "version": "Mark VII",
        "timestamp": datetime.utcnow().isoformat()
    }

# ---------------------------------------------------------
# SESSIONS ENDPOINTS (Chat History & New Chat)
# ---------------------------------------------------------

@app.get("/api/sessions", response_model=List[schemas.SessionOut])
def get_sessions(db: Session = Depends(get_db)):
    """Fetch all chat sessions ordered by most recently updated."""
    sessions = db.query(models.ChatSession).order_by(desc(models.ChatSession.updated_at)).all()
    results = []
    for s in sessions:
        results.append(
            schemas.SessionOut(
                id=s.id,
                title=s.title,
                created_at=s.created_at,
                updated_at=s.updated_at,
                message_count=len(s.messages)
            )
        )
    return results

@app.post("/api/sessions", response_model=schemas.SessionDetailOut, status_code=status.HTTP_201_CREATED)
def create_session(session_data: schemas.SessionCreate, db: Session = Depends(get_db)):
    """Create a new chat session ('New Chat')."""
    new_session = models.ChatSession(
        title=session_data.title or "New Neural Session"
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    # Automatically add initial Jarvis greeting message to the new session
    greeting = models.ChatMessage(
        session_id=new_session.id,
        sender="jarvis",
        text="Greetings, sir. New neural thread established. J.A.R.V.I.S. Mark VII is listening."
    )
    db.add(greeting)
    db.commit()
    db.refresh(new_session)

    return new_session

@app.get("/api/sessions/{session_id}", response_model=schemas.SessionDetailOut)
def get_session(session_id: str, db: Session = Depends(get_db)):
    """Fetch a specific session and its full message history."""
    session_obj = db.query(models.ChatSession).filter(models.ChatSession.id == session_id).first()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found")
    return session_obj

@app.delete("/api/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(session_id: str, db: Session = Depends(get_db)):
    """Delete a chat session and all its messages."""
    session_obj = db.query(models.ChatSession).filter(models.ChatSession.id == session_id).first()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session_obj)
    db.commit()
    return None

# ---------------------------------------------------------
# MESSAGING & AI RESPONSE ENDPOINTS
# ---------------------------------------------------------

@app.post("/api/sessions/{session_id}/messages", response_model=schemas.ChatQueryResponse)
def send_message(session_id: str, payload: schemas.ChatQueryRequest, db: Session = Depends(get_db)):
    """
    Send a message in a session:
    1. Persist user message in SQLite database.
    2. Generate intelligent response from Jarvis AI.
    3. Persist Jarvis response in SQLite database.
    4. Auto-update session title if it's the first user message.
    """
    session_obj = db.query(models.ChatSession).filter(models.ChatSession.id == session_id).first()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found")

    # 1. Save User Message
    user_msg = models.ChatMessage(
        session_id=session_id,
        sender="user",
        text=payload.query
    )
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    # 2. Generate Jarvis AI response
    jarvis_reply_text = JarvisAIService.process_query(payload.query)

    # 3. Save Jarvis Message
    jarvis_msg = models.ChatMessage(
        session_id=session_id,
        sender="jarvis",
        text=jarvis_reply_text
    )
    db.add(jarvis_msg)

    # 4. Update session metadata and auto-title if needed
    if session_obj.title in ["New Neural Session", "New Session", ""]:
        session_obj.title = JarvisAIService.generate_title(payload.query)
    
    session_obj.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(jarvis_msg)

    return schemas.ChatQueryResponse(
        user_message=schemas.MessageOut.from_orm(user_msg),
        jarvis_message=schemas.MessageOut.from_orm(jarvis_msg),
        session_id=session_id
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
