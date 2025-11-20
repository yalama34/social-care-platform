from email.header import Header

from ..common.database import SessionDep
from ..common.models import RegisterRequest, RequestModel, UserModel
from fastapi import APIRouter, HTTPException, Depends
from datetime import timedelta, datetime
from sqlalchemy import select
from authx import AuthX, AuthXConfig
from ..services.profile import ProfileService


config = AuthXConfig(
    JWT_SECRET_KEY="secret-key",
    JWT_ACCESS_TOKEN_EXPIRES=timedelta(days=2),
)
security = AuthX(config=config)

profile_router = APIRouter(tags=["profile"])

@profile_router.get("/profile")
async def get_user_profile(session: SessionDep, authorization: str =  Header(None)):
    print(security._config.JWT_SECRET_KEY)
    if not authorization:
        raise HTTPException(status_code=401, detail="Token is not given")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")
    access_token = authorization.split()[1]
    print(access_token)
    access_token = security._decode_token(token=access_token)
    profile_service = ProfileService(session)
    profile_info = await profile_service.get_profile(access_token)
    return profile_info
