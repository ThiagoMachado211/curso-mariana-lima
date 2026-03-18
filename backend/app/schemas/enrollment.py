import uuid
from datetime import datetime

from pydantic import BaseModel


class EnrollmentCreate(BaseModel):
    user_id: uuid.UUID
    course_id: uuid.UUID


class EnrollmentOut(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    user_id: uuid.UUID
    course_id: uuid.UUID
    status: str
    created_at: datetime

    class Config:
        from_attributes = True