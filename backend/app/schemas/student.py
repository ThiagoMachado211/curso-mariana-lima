from uuid import UUID
from pydantic import BaseModel


class StudentCourseOut(BaseModel):
    id: UUID
    title: str
    slug: str | None = None
    description: str | None = None
    price_cents: int | None = 0
    currency: str | None = "BRL"
    is_active: bool
    is_published: bool

    class Config:
        from_attributes = True


class StudentModuleOut(BaseModel):
    id: UUID
    course_id: UUID
    title: str
    order: int

    class Config:
        from_attributes = True


class StudentLessonOut(BaseModel):
    id: UUID
    module_id: UUID
    title: str
    order: int
    video_embed_url: str | None = None
    pdf_url: str | None = None
    description: str | None = None

    class Config:
        from_attributes = True