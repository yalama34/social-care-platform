from fastapi import HTTPException, APIRouter, Header
from ..common.database import SessionDep
from ..common.models import RequestModel, ComplaintRequest, UserModel
from ..services.chat import ChatService
from ..services.profile import ProfileService
from sqlalchemy import select
from authx import AuthX, AuthXConfig
from datetime import timedelta
from ..services.analysis import AnalysisService

moderation_router = APIRouter(prefix="/complaint", tags=["moderation"])

config = AuthXConfig(
    JWT_SECRET_KEY="secret-key",
    JWT_ACCESS_TOKEN_EXPIRES=timedelta(days=2),
)
security = AuthX(config=config)


@moderation_router.post("/{complaint_type}")
async def request_moderation(
    complaint_type: str,
    request: ComplaintRequest,
    session: SessionDep,
    authorization: str = Header(None)
):
    if complaint_type not in ("chat", "profile", "request"):
        raise HTTPException(status_code=400, detail="Invalid complaint type. Must be: chat, profile, request")

    if not authorization:
        raise HTTPException(status_code=401, detail="Token is not given")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")

    token = authorization.split()[1]
    try:
        payload = security._decode_token(token=token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    sus_user_result = await session.execute(
        select(UserModel).where(UserModel.id == request.sus_user_id)
    )
    sus_user = sus_user_result.scalar()
    if not sus_user:
        raise HTTPException(status_code=404, detail="Suspect user not found")
    sus_role = "user"
    if request.request_id:
        req_result = await session.execute(
            select(RequestModel).where(RequestModel.id == request.request_id)
        )
        req = req_result.scalar()
        if req:
            if req.volunteer_id == request.sus_user_id:
                sus_role = "volunteer"
            elif req.user_id == request.sus_user_id:
                sus_role = "user"

    details = {}

    if complaint_type == "chat":
        if not request.request_id:
            raise HTTPException(status_code=400, detail="request_id required for chat complaint")
        chat_service = ChatService(session)
        messages = await chat_service.get_history(
            request_id=request.request_id,
            user_id=payload.user_id,
            user_role=payload.role
        )
        user_messages = [m["message"] for m in messages if m["role"] == "user"]
        volunteer_messages = [m["message"] for m in messages if m["role"] == "volunteer"]
        details = {
            "user": user_messages,
            "volunteer": volunteer_messages
        }

    elif complaint_type == "request":
        if not request.request_id:
            raise HTTPException(status_code=400, detail="request_id required for request complaint")
        req_result = await session.execute(
            select(RequestModel).where(RequestModel.id == request.request_id)
        )
        req = req_result.scalar()
        if not req:
            raise HTTPException(status_code=404, detail="Request not found")
        details = {
            "id": req.id,
            "user_id": req.user_id,
            "full_name": req.full_name,
            "service_type": req.service_type,
            "address": req.address,
            "comment": req.comment,
            "desired_time": str(req.desired_time),
            "status": req.status,
            "volunteer_id": req.volunteer_id
        }

    elif complaint_type == "profile":
        profile_service = ProfileService(session)
        profile_data = await profile_service.get_profile_by_id(request.sus_user_id)
        details = {
            "fullname": profile_data.get("full_name", ""),
            "video": profile_data.get("video", ""),
            "about": profile_data.get("about", "")
        }

    complainant = {
        "uid": payload.user_id,
        "role": payload.role
    }
    suspend = {
        "uid": request.sus_user_id,
        "role": sus_role
    }

    analyze = AnalysisService()
    ai_response = await analyze.analyze(
        complaint_type=complaint_type,
        complaint_text=request.complaint_text,
        complainant=complainant,
        suspend=suspend,
        details=details
    )
    ai_response["complainant_id"] = complainant["uid"]
    ai_response["suspect_id"] = suspend["uid"]

    # Гарантируем, что в каждом punishment есть роль
    if "punishments" in ai_response:
        for punishment in ai_response["punishments"]:
            if "role" not in punishment:
                # Добавляем роль на основе user_id
                if punishment["user_id"] == complainant["uid"]:
                    punishment["role"] = complainant["role"]
                elif punishment["user_id"] == suspend["uid"]:
                    punishment["role"] = suspend["role"]

    return ai_response
