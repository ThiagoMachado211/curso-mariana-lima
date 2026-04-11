from sqlalchemy.orm import DeclarativeBase
from app.models.password_reset_token import PasswordResetToken

class Base(DeclarativeBase):
    pass


""" 
from app.models.user import User
from app.models.tenant import Tenant
from app.models.course import Course
from app.models.module import Module
from app.models.lesson import Lesson
from app.models.enrollment import Enrollment 
"""