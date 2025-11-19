from ..common.database import SessionDep
from ..common.models import RegisterRequest, RequestModel, UserModel, CheckSessionRequest
from fastapi import APIRouter, HTTPException
from datetime import timedelta, datetime
from sqlalchemy import select
from authx import AuthX, AuthXConfig

config = AuthXConfig(
    JWT_SECRET_KEY="secret-key",
    JWT_ACCESS_TOKEN_EXPIRES=timedelta(days=2),
)
security = AuthX(config=config)
home_router = APIRouter(prefix="/home", tags=["home"])


@home_router.post("/{role}")
async def user_home(role: str, request: CheckSessionRequest, session : SessionDep):
    '''Домашняя страница пользователя'''
    try:
        payload = security._decode_token(token=request.access_token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    request_data = await session.execute(select(RequestModel).where(RequestModel.user_id == payload.user_id))
    all_requests = request_data.scalars().all()

    active_requests = {}
    completed_requests = {}

    for req in all_requests:
        request_dict = {
            "user_id": req.user_id,
            "id": req.id,
            "full_name": req.full_name,
            "service_type": req.service_type,
            "address": req.address,
            "comment": req.comment,
            "desired_time": req.desired_time.isoformat() if hasattr(req.desired_time, 'isoformat') else str(
                req.desired_time),
            "status": req.status,
        }

        if req.status != "completed":
            active_requests[str(req.id)] = request_dict

        elif req.status == "completed":
            completed_requests[str(req.id)] = request_dict

    if not all_requests:
        return {"message": "No Requests found"}

    latest_active = dict(sorted(active_requests.items(), key=lambda x: int(x[0]), reverse=True)[:3])
    latest_completed = dict(sorted(completed_requests.items(), key=lambda x: int(x[0]), reverse=True)[:3]) # тут отсекаем последние 3 в обеих категориях(не забыть добавить request_history)


    return {
        "active_requests": latest_active,
        "completed_requests": latest_completed,
    }
