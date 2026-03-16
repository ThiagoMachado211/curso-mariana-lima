import uuid
from pydantic import BaseModel, ConfigDict


class ModuleCreate(BaseModel):
    course_id: uuid.UUID
    title: str
    order: int


class ModuleUpdate(BaseModel):
    course_id: uuid.UUID
    title: str
    order: int


class ModuleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    course_id: uuid.UUID
    title: str
    order: int