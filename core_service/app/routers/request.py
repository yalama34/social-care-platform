from ..common.database import SessionDep
from ..common.models import RegisterRequest, RequestModel, UserModel
from fastapi import APIRouter, HTTPException
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
async def register_request(session: SessionDep, request: RegisterRequest):
    print(security._config.JWT_SECRET_KEY)
    request_service = RequestService(session = session)
    try:
        try:
            access_token = security._decode_token(request.access_token)
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

        await request_service.register_request(access_token=access_token, request=request)
        return {
            "success": True
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
