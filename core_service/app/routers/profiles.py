from ..common.database import SessionDep
from ..common.models import AboutRequest
from fastapi import APIRouter, HTTPException, Depends, Header
from datetime import timedelta, datetime
from sqlalchemy import select
from authx import AuthX, AuthXConfig
from ..services.profile import ProfileService


config = AuthXConfig(
    JWT_SECRET_KEY="secret-key",
    JWT_ACCESS_TOKEN_EXPIRES=timedelta(days=2),
)
security = AuthX(config=config)

profile_router = APIRouter(tags=["profile"], prefix="/profile")

@profile_router.get("/{user_id}")
async def get_user_profile(user_id: int, session: SessionDep, authorization: str =  Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token is not given")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")
    access_token = authorization.split()[1]

    access_token = security._decode_token(token=access_token)
    access_user_id = access_token.user_id
    profile_service = ProfileService(session)
    profile_info = await profile_service.get_profile_by_id(user_id, access_user_id)
    return profile_info

@profile_router.post("/about")
async def update_about(session: SessionDep, request: AboutRequest, authorization: str = Header(None)):
    print(authorization)
    if not authorization:
        raise HTTPException(status_code=401, detail="Token is not given")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")
    access_token = authorization.split()[1]

    access_token = security._decode_token(token=access_token)
    profile_service = ProfileService(session)
    await profile_service.change_about(access_token=access_token, about=request.about)
    return {
        "success": True
    }


