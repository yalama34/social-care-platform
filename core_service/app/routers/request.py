from ..common.database import SessionDep
from ..common.models import RegisterRequest, RequestModel, UserModel
from fastapi import APIRouter, HTTPException, Header
from datetime import timedelta, datetime
from sqlalchemy import select
from authx import AuthX, AuthXConfig
from ..services.request import RequestService

config = AuthXConfig(
    JWT_SECRET_KEY="secret-key",
    JWT_ACCESS_TOKEN_EXPIRES=timedelta(days=2),
)
security = AuthX(config=config)
request_router = APIRouter(prefix="/request", tags=["request"])

@request_router.post("/register")
async def register_request(session: SessionDep, request: RegisterRequest, authorization: str = Header(None)):
    request_service = RequestService(session = session)
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Token is not given")
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid token format")
        access_token = authorization.split()[1]
        access_token = security._decode_token(token=access_token)

        await request_service.register_request(access_token=access_token, request=request)
        return {
            "success": True
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
