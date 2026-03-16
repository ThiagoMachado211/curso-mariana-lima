import uuid
from pydantic import BaseModel, ConfigDict


class CourseCreate(BaseModel):
    title: str
    slug: str
    description: str | None = None
    price_cents: int = 0
    is_active: bool = True
    is_published: bool = False
    currency: str = "BRL"


class CourseUpdate(BaseModel):
    title: str
    slug: str
    description: str | None = None
    price_cents: int = 0
    is_active: bool = True
    is_published: bool = False
    currency: str = "BRL"


class CourseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    title: str
    slug: str
    description: str | None
    price_cents: int
    is_active: bool
    is_published: bool
    currency: str