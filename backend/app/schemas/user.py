import uuid
from pydantic import BaseModel, EmailStr


class UserOut(BaseModel):
    id: uuid.UUID
    name: str
    email: EmailStr
    role: str
    is_active: bool

    class Config:
        from_attributes = True