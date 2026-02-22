import uuid
from pydantic import BaseModel


class LessonCreate(BaseModel):
    module_id: uuid.UUID
    title: str
    order: int = 1
    video_embed_url: str | None = None
    pdf_url: str | None = None


class LessonUpdate(BaseModel):
    title: str | None = None
    order: int | None = None
    video_embed_url: str | None = None
    pdf_url: str | None = None


class LessonOut(BaseModel):
    id: uuid.UUID
    module_id: uuid.UUID
    title: str
    order: int
    video_embed_url: str | None = None
    pdf_url: str | None = None

    class Config:
        from_attributes = True