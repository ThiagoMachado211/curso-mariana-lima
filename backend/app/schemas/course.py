import uuid
from pydantic import BaseModel


class CourseOut(BaseModel):
    id: uuid.UUID
    title: str
    slug: str
    price_cents: int
    is_active: bool

    class Config:
        from_attributes = True


class LessonNode(BaseModel):
    id: uuid.UUID
    title: str
    order: int
    video_embed_url: str | None = None
    pdf_url: str | None = None

    class Config:
        from_attributes = True


class ModuleNode(BaseModel):
    id: uuid.UUID
    title: str
    order: int
    lessons: list[LessonNode] = []


class CourseTree(BaseModel):
    course_id: uuid.UUID
    title: str
    modules: list[ModuleNode]