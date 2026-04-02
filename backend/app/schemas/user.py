from uuid import UUID
from pydantic import BaseModel, EmailStr


class UserOut(BaseModel):
    id: UUID
    tenant_id: UUID
    name: str
    last_name: str
    email: EmailStr
    role: str
    is_active: bool

    class Config:
        from_attributes = True


class UserUpdateMe(BaseModel):
    name: str
    last_name: str
    email: EmailStr