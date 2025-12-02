import re
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import ForeignKey, String, Integer, DateTime, Boolean
import datetime
from sqlalchemy.sql import func

class User(BaseModel):
    id: int
    full_name: str
    email: str

#DateBase models
class Base(DeclarativeBase):
    pass

class UserModel(Base):
    __tablename__ = 'users'
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    full_name: Mapped[str] = mapped_column(String)
    email: Mapped[str] = mapped_column(String, index=True, unique=True)

class RefreshToken(Base):
    __tablename__ = 'refresh_tokens'
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    role: Mapped[str] = mapped_column(default="user")
    token: Mapped[str] = mapped_column(unique=True, index=True)
    created_at: Mapped[datetime.datetime] = mapped_column(default=func.now())
    expires_at: Mapped[datetime.datetime] = mapped_column(index=True)
    is_revoked: Mapped[bool] = mapped_column(default=False)


#Requests models
class EmailRequest(BaseModel):
    email: str

    @field_validator('email')
    def validate_email(cls, value: str) -> Exception | str:
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, value):
            raise ValueError('Invalid email address')
        return value.lower()

class VerifyEmail(BaseModel):
    email: str
    code: str

class EndRegisterRequest(BaseModel):
    full_name: str
    temp_token: str

    @field_validator('full_name')
    def validate_full_name(cls, value) -> Exception | str:
        if not re.match(r"^[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+$", value): #пока что регулярка только для стандартного ввода ФИО (без двойных фамилий, не подразумевает ввода только ФИ)
            raise ValueError('Invalid full name')
        return value

class EndLoginRequest(BaseModel):
    temp_token: str
    role: str

class CheckSessionRequest(BaseModel):
    access_token: str