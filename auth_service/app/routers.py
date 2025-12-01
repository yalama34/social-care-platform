from fastapi import APIRouter, HTTPException
from shared.models import PhoneRequest, VerifyPhone, EndRegisterRequest, EndLoginRequest
from authx import AuthX, AuthXConfig
from service import TokenService
from shared.database import SessionDep
from datetime import timedelta, datetime
from shared.models import UserModel, RefreshToken
from sqlalchemy.future import select

temp_config = AuthXConfig(
    JWT_SECRET_KEY="temp-secret-key",
    JWT_ACCESS_TOKEN_EXPIRES=timedelta(minutes=10),
)
temp_security = AuthX(config=temp_config)

config = AuthXConfig(
    JWT_SECRET_KEY="secret-key",
    JWT_ACCESS_TOKEN_EXPIRES=timedelta(days=2),
)
security = AuthX(config=config)

router = APIRouter(prefix="/auth", tags=["auth"])

#регистрация
@router.post("/start-register")
async def start_register(request: PhoneRequest, session : SessionDep):
    """Проверка, не был ли зарегестрирован пользователь ранее. Отправка кода по указанному номеру телефона."""
    print("Получен номер:", request.phone, flush=True)
    result = await session.execute(
        select(UserModel).where(UserModel.phone == request.phone)
    )
    user = result.scalar()
    print("Найден пользователь:", user, flush=True)
    if user:
        raise HTTPException(status_code=400, detail="Номер телефона уже зарегистрирован")
    return {
        "code_sent": True,
        "phone": request.phone,
        "wait_time": datetime.now() + timedelta(seconds=60),
        }

@router.post("/verify-phone")
async def verify_phone(request: VerifyPhone, session: SessionDep) -> dict:
    """Проверка кода, создание временного токена для завершения регистрации"""
    if not request.code == "123456":
        raise HTTPException(status_code=400, detail="Неверный код   ")
    is_login = await session.execute(select(UserModel).where(UserModel.phone == request.phone))
    is_login = is_login.scalar()
    if is_login:
        purpose = "login"
    else:
        purpose = "registration"
    temp_token = temp_security.create_access_token(
        uid = request.phone,
        data={
        'purpose': purpose,
        'phone': request.phone,
        } #безопасность
    )
    print("Получен номер:", request.phone)
    return {
        "verified": True,
        "temp_token": temp_token,
        "purpose": purpose,
    }

@router.post("/end-register")
async def end_register(request: EndRegisterRequest, session : SessionDep) -> dict:
    try:
        payload = temp_security._decode_token(token=request.temp_token)
    except Exception:
        raise HTTPException(status_code=401, detail="Неверный или истёкший токен")
    if payload.purpose != 'registration':
        raise HTTPException(status_code=400, detail="Неверная причина выдачи токена")

    user = UserModel(
        full_name=request.full_name,
        phone=payload.phone,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    token = TokenService(session)
    refresh_token = await token.create_refresh_token(user_id=user.id, role=request.role)
    print("Refresh токен успешно создан", refresh_token.token, flush=True)
    access_token = await token.create_access_token(user_id=user.id, security=security, role=request.role)

    print("Access токен успешно создан", access_token, flush=True)
    return {
        "access_token": access_token,
    }

@router.post("/login-start")
async def login(request: PhoneRequest, session : SessionDep) -> dict:
    print("Получен номер:", request.phone, flush=True)
    result = await session.execute(
        select(UserModel).where(UserModel.phone == request.phone)
    )
    user = result.scalar()
    print("Найден пользователь:", user, flush=True)
    if not user:
        raise HTTPException(status_code=400, detail="Номер телефона не зарегистрирован")

    return {
        "code_sent": True,
        "phone": request.phone,
        "wait_time": 60,
    }

@router.post("/login-end")
async def login_end(request: EndLoginRequest, session : SessionDep) -> dict:
    try:
        payload = temp_security._decode_token(token=request.temp_token)
    except Exception:
        raise HTTPException(status_code=401, detail="Неверный или истёкший токен")
    if payload.purpose != 'login':
        raise HTTPException(status_code=400, detail="Неверная причина выдачи токена")

    data = await session.execute(select(RefreshToken).where(UserModel.phone == payload.phone))
    user = data.scalar()
    token = TokenService(session)
    access_token = await token.create_access_token(user_id=user.user_id, security=security)
    await token.update_refresh_token(access_token)
    return {
        "access_token": access_token,
        "role": user.role,
    }


