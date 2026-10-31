from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class MessageBase(BaseModel):
    sender: str
    text: str

class MessageCreate(MessageBase):
    pass

class MessageOut(MessageBase):
    id: int
    session_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class SessionCreate(BaseModel):
    title: Optional[str] = "New Neural Session"

class SessionOut(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: Optional[int] = 0

    class Config:
        from_attributes = True

class SessionDetailOut(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageOut] = []

    class Config:
        from_attributes = True

class ChatQueryRequest(BaseModel):
    query: str = Field(..., min_length=1, description="User prompt or voice command")

class ChatQueryResponse(BaseModel):
    user_message: MessageOut
    jarvis_message: MessageOut
    session_id: str
    action: Optional[dict] = None
