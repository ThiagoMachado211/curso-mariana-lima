from typing import List
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class EnrollmentResponse(BaseModel):
    course_id: UUID
    course_title: str
    status: str


class AdminUserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    role: str = Field(default="student")
    is_active: bool = True
    initial_course_ids: List[UUID] = []


class AdminUserUpdate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    role: str
    is_active: bool


class AdminUserResponse(BaseModel):
    id: UUID
    name: str
    last_name: str
    email: EmailStr
    role: str
    is_active: bool
    tenant_id: UUID

    class Config:
        from_attributes = True


class AdminUserDetailsResponse(BaseModel):
    id: UUID
    name: str
    last_name: str
    email: EmailStr
    role: str
    is_active: bool
    tenant_id: UUID
    enrollments: list[EnrollmentResponse]

    class Config:
        from_attributes = True