from ..common.database import SessionDep
from ..common.models import RegisterRequest, RequestModel, UserModel
from fastapi import APIRouter, HTTPException, Header
from datetime import timedelta, datetime
from sqlalchemy import select
from authx import AuthX, AuthXConfig
from ..services.punish import PunishService

config = AuthXConfig(
    JWT_SECRET_KEY="secret-key",
    JWT_ACCESS_TOKEN_EXPIRES=timedelta(days=2),
)
security = AuthX(config=config)

verdict_router = APIRouter(prefix="/verdict", tags=["verdict"])

@verdict_router.post("/{user_verdict}/{user_id}")
async def verdict(user_id: int, user_verdict: str, session: SessionDep, authorization: str = Header(None)):
    punish_service = PunishService(session)
    if user_verdict == "ban":
        await punish_service.ban_user(user_id)
    elif user_verdict == "warning":
        await punish_service.warn_user(user_id)
    return {"applied": True}

