import uuid
from pydantic import BaseModel, ConfigDict


class LessonCreate(BaseModel):
    module_id: uuid.UUID
    title: str
    order: int
    video_embed_url: str | None = None
    pdf_url: str | None = None


class LessonUpdate(BaseModel):
    module_id: uuid.UUID
    title: str
    order: int
    video_embed_url: str | None = None
    pdf_url: str | None = None


class LessonOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    module_id: uuid.UUID
    title: str
    order: int
    video_embed_url: str | None
    pdf_url: str | None