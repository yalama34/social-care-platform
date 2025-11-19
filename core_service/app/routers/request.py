from ..common.database import SessionDep
from ..common.models import RegisterRequest, RequestModel, UserModel
from fastapi import APIRouter, HTTPException
from datetime import timedelta, datetime
from sqlalchemy import select
from authx import AuthX, AuthXConfig

config = AuthXConfig(
    JWT_SECRET_KEY="secret-key",
    JWT_ACCESS_TOKEN_EXPIRES=timedelta(days=2),
)
security = AuthX(config=config)
request_router = APIRouter(prefix="/request", tags=["request"])

@request_router.post("/register")
async def register_request(session: SessionDep, request: RegisterRequest):
    try:
        try:
            access_token = security._decode_token(request.access_token)
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
        
        result = await session.execute(
            select(UserModel).where(UserModel.id == access_token.user_id)
        )
        user = result.scalar()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        desired_time_str = request.desired_time
        try:
            desired_time = datetime.fromisoformat(desired_time_str)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid desired_time format. Expected ISO format, got '{desired_time_str}'"
            )
        user_request = RequestModel(
            user_id=user.id,
            full_name=request.full_name,
            service_type=request.service_type,
            address=request.address,
            comment=request.comment,
            desired_time=desired_time,
        )
        session.add(user_request)
        await session.commit()
        await session.refresh(user_request)
        return {
            "success": True
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
