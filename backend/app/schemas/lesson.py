import uuid
from pydantic import BaseModel, Field
from typing import Optional


class LessonPdfBase(BaseModel):
    title: str
    pdf_url: str
    order: int = 1


class LessonPdfCreate(LessonPdfBase):
    pass


class LessonPdfOut(LessonPdfBase):
    id: uuid.UUID

    class Config:
        from_attributes = True


class LessonBase(BaseModel):
    module_id: uuid.UUID
    title: str
    order: int
    video_embed_url: Optional[str] = None


class LessonCreate(LessonBase):
    pdfs: list[LessonPdfCreate] = Field(default_factory=list, max_length=25)
    pdf_url: Optional[str] = None  # legado opcional


class LessonUpdate(BaseModel):
    module_id: Optional[uuid.UUID] = None
    title: Optional[str] = None
    order: Optional[int] = None
    video_embed_url: Optional[str] = None
    pdfs: Optional[list[LessonPdfCreate]] = Field(default=None, max_length=25)
    pdf_url: Optional[str] = None  # legado opcional


class LessonOut(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    module_id: uuid.UUID
    title: str
    order: int
    video_embed_url: Optional[str] = None
    pdf_url: Optional[str] = None
    pdfs: list[LessonPdfOut] = []

    class Config:
        from_attributes = True