import uuid
from pydantic import BaseModel


class ModuleCreate(BaseModel):
    course_id: uuid.UUID
    title: str
    order: int = 1


class ModuleUpdate(BaseModel):
    title: str | None = None
    order: int | None = None


class ModuleOut(BaseModel):
    id: uuid.UUID
    course_id: uuid.UUID
    title: str
    order: int

    class Config:
        from_attributes = True