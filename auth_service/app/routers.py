from fastapi import APIRouter, HTTPException
from shared.models import EmailRequest, VerifyEmail, EndRegisterRequest, EndLoginRequest
from authx import AuthX, AuthXConfig
from service import TokenService, EmailService
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
async def start_register(request: EmailRequest, session : SessionDep):
    """Проверка, не был ли зарегестрирован пользователь ранее. Отправка кода на указанный email."""
    print("Получен email:", request.email, flush=True)
    result = await session.execute(
        select(UserModel).where(UserModel.email == request.email)
    )
    user = result.scalar()
    print("Найден пользователь:", user, flush=True)
    if user:
        raise HTTPException(status_code=400, detail="Email уже зарегистрирован")
    
    # Генерация и отправка кода
    email_service = EmailService(session)
    code = email_service.generate_code()
    await email_service.send_verification_code(request.email, code)
    await email_service.save_verification_code(request.email, code)
    
    return {
        "code_sent": True,
        "email": request.email,
        "wait_time": datetime.now() + timedelta(seconds=60),
        }

@router.post("/verify-email")
async def verify_email(request: VerifyEmail, session: SessionDep) -> dict:
    """Проверка кода, создание временного токена для завершения регистрации"""
    email_service = EmailService(session)
    is_valid = await email_service.verify_code(request.email, request.code)
    
    if not is_valid:
        raise HTTPException(status_code=400, detail="Неверный код или код истёк")
    
    is_login = await session.execute(select(UserModel).where(UserModel.email == request.email))
    is_login = is_login.scalar()
    if is_login:
        purpose = "login"
    else:
        purpose = "registration"
    temp_token = temp_security.create_access_token(
        uid = request.email,
        data={
        'purpose': purpose,
        'email': request.email,
        } #безопасность
    )
    print("Получен email:", request.email)
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
        email=payload.email,
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
async def login(request: EmailRequest, session: SessionDep) -> dict:
    result = await session.execute(
        select(UserModel).where(UserModel.email == request.email)
    )
    user = result.scalar()
    if not user:
        raise HTTPException(status_code=400, detail="Email не зарегистрирован")

    # === ПРОВЕРКА БАНА ===
    refresh_data = await session.execute(
        select(RefreshToken).where(RefreshToken.user_id == user.id)
    )
    refresh_token = refresh_data.scalar()
    if refresh_token and refresh_token.is_revoked:
        raise HTTPException(status_code=403, detail="Ваш аккаунт заблокирован")
    
    # Генерация и отправка кода
    email_service = EmailService(session)
    code = email_service.generate_code()
    await email_service.send_verification_code(request.email, code)
    await email_service.save_verification_code(request.email, code)
    
    return {
        "code_sent": True,
        "email": request.email,
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

    data = await session.execute(select(UserModel).where(UserModel.email == payload.email))
    user = data.scalar()
    token = TokenService(session)
    await token.update_refresh_token(user.id)
    access_token = await token.create_access_token(user_id=user.id, security=security)
    return {
        "access_token": access_token,
    }


