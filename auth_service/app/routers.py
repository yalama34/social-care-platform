from fastapi import APIRouter, HTTPException
from models import User, PhoneRequest, VerifyPhone, EndRegisterRequest
from authx import AuthX, AuthXConfig
from service import TokenService
from datebase import SessionDep
from datetime import timedelta
from models import UserModel
from sqlalchemy import select

temp_config = AuthXConfig(
    JWT_SECRET_KEY="temp-secret-key",
    JWT_ACCESS_TOKEN_EXPIRES=timedelta(minutes=10),
)
temp_security = AuthX(config=temp_config)

config = AuthXConfig(
    JWT_SECRET_KEY="secret-key",
    JWT_ACCESS_TOKEN_EXPIRES=timedelta(hours=2),
    JWT_REFRESH_TOKEN_EXPIRES=timedelta(weeks=2),
)
security = AuthX(config=config)

router = APIRouter(prefix="/auth", tags=["auth"])

#регистрация
@router.post("/start-register")
async def start_register(request: PhoneRequest, session = SessionDep):
    """Отправка кода на указанный номер телефона"""
    is_exist = await session.execute(select(UserModel).where(
        UserModel.phone == request.phone
    ))
    if is_exist.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="Phone already registered"
        )
    return {
        "code_sent": True,
        "phone": request.phone,
        "wait_time": 60,
    }

@router.post("/verify-phone")
async def verify_phone(request: VerifyPhone):
    """Проверка кода, создание временного токена для завершения регистрации"""
    if not request.code == "123456":
        raise HTTPException(status_code=400, detail="Invalid code")
    temp_token = temp_security.create_access_token(
        data={
        'purpose': 'registration',
        'phone': request.phone,
        } #безопасность
    )
    return {
        "verified": True,
        "temp_token": temp_token,
    }

@router.post("/end-register")
async def end_register(request: EndRegisterRequest, session = SessionDep):
    try:
        payload = temp_security._decode_token(token=request.temp_token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    if payload.get("purpose") != 'registration':
        raise HTTPException(status_code=400, detail="Invalid token purpose")
    user = UserModel(
        full_name=request.full_name,
        phone=payload.get("phone"),
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)

    token = TokenService(session)
    refresh_token = await token.create_refresh_token(user_id=user.id)
    access_token = await token.create_access_token(user_id=user.id, security=security)
    return {
        "id": user.id,
        "full_name": request.full_name,
        "phone": payload.get("phone"),
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

