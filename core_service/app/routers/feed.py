from ..common.database import SessionDep
from ..common.models import RegisterRequest, RequestModel, UserModel, AcceptRequest
from fastapi import APIRouter, HTTPException, Header
from datetime import timedelta, datetime
from sqlalchemy import select
from authx import AuthX, AuthXConfig

config = AuthXConfig(
    JWT_SECRET_KEY="secret-key",
    JWT_ACCESS_TOKEN_EXPIRES=timedelta(days=2),
)
security = AuthX(config=config)
feed_router = APIRouter()

@feed_router.get("/request-feed")
async def request_feed(session: SessionDep, authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token is not given")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")
    access_token = authorization.split()[1]
    access_token = security._decode_token(token=access_token)
    if access_token.role == "user":
        raise HTTPException(status_code=403, detail="Forbidden")
    
    data = await session.execute(select(RequestModel).where(RequestModel.status == "onwait"))
    requests = data.scalars().all()
    return_requests = []

    for req in requests:
        request = {
            "user_id": req.user_id,
            "id": req.id,
            "full_name": req.full_name,
            "service_type": req.service_type,
            "address": req.address,
            "comment": req.comment,
            "desired_time": req.desired_time.isoformat() if hasattr(req.desired_time, 'isoformat') else str(req.desired_time),
        }
        return_requests.append(request)
    return return_requests

@feed_router.post("/request-feed")
async def accept_request(session: SessionDep, request: AcceptRequest, authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token is not given")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")
    access_token = authorization.split()[1]
    access_token = security._decode_token(token=access_token)
    if access_token.role == "user":
        raise HTTPException(status_code=403, detail="Forbidden")
    data = await session.execute(select(RequestModel).where(RequestModel.id == request.request_id))
    data = data.scalar()
    data.status = "in_progress"
    session.add(data)
    await session.commit()
    session.refresh(data)

    return {
        "success": True
    }





