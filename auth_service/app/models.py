import re
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