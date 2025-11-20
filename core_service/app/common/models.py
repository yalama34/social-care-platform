import re
from typing import Optional

from pydantic import BaseModel, field_validator
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import ForeignKey, String, Integer, DateTime, Boolean
import datetime
from sqlalchemy.sql import func

class User(BaseModel):
    id: int
    full_name: str
    phone: str
    access_token: str
    refresh_token: str

#DateBase models
class Base(DeclarativeBase):
    pass

class UserModel(Base):
    __tablename__ = 'users'
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    full_name: Mapped[str] = mapped_column(String)
    phone: Mapped[str] = mapped_column(String, index=True)
    about: Mapped[str] = mapped_column(String, default="")

class RefreshToken(Base):
    __tablename__ = 'refresh_tokens'
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    role: Mapped[str] = mapped_column(default="user")
    token: Mapped[str] = mapped_column(unique=True, index=True)
    created_at: Mapped[datetime.datetime] = mapped_column(default=func.now())
    expires_at: Mapped[datetime.datetime] = mapped_column(index=True)
    is_revoked: Mapped[bool] = mapped_column(default=False)

class RequestModel(Base):
    __tablename__ = 'requests'
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'))
    full_name: Mapped[str] = mapped_column(String)
    service_type: Mapped[str] = mapped_column(String)
    address: Mapped[str] = mapped_column(String)
    comment: Mapped[str] = mapped_column(String)
    desired_time: Mapped[datetime.datetime] = mapped_column(DateTime)
    status: Mapped[str] = mapped_column(String, default="onwait")
    volunteer_id: Mapped[Optional[int]] = mapped_column(Integer, default=-1)

#Requests models
class PhoneRequest(BaseModel):
    phone: str

    @field_validator('phone')
    def validate_phone_number(cls, value):
        if not re.match(r'(\s*)?(\+)?([- _():=+]?\d[- _():=+]?){10,14}(\s*)', value):
            raise ValueError('Invalid phone number')
        return value

class VerifyPhone(BaseModel):
    phone: str
    code: str

class EndRegisterRequest(BaseModel):
    full_name: str
    temp_token: str

    @field_validator('full_name')
    def validate_full_name(cls, value):
        if not re.match(r"^[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+$", value): #пока что регулярка только для стандартного ввода ФИО (без двойных фамилий, не подразумевает ввода только ФИ)
            raise ValueError('Invalid full name')
        return value

class EndLoginRequest(BaseModel):
    temp_token: str

class CheckSessionRequest(BaseModel):
    access_token: str

class RegisterRequest(BaseModel):
    address: str
    comment: str
    desired_time: str
    full_name: str
    service_type: str
    @field_validator('desired_time')
    def validate_desired_time(cls, value):
        try:
            from datetime import datetime
            datetime.fromisoformat(value)
            return value
        except ValueError:
            raise ValueError(f"Invalid datetime format. Expected ISO format like '2025-11-17T12:00', got '{value}'")