from datetime import timedelta

from fastapi import APIRouter, HTTPException, Header
from sqlalchemy import select
from authx import AuthX, AuthXConfig

from ..common.database import SessionDep
from ..common.models import ComplaintModel, PunishmentRequest
from ..services.punish import PunishService


config = AuthXConfig(
    JWT_SECRET_KEY="secret-key",
    JWT_ACCESS_TOKEN_EXPIRES=timedelta(days=2),
)
security = AuthX(config=config)
admin_router = APIRouter(prefix="/admin", tags=["admin panel"])


@admin_router.post("/complaints")
async def complaints_count(session: SessionDep, authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token is not given")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")

    access_token = authorization.split()[1]
    access_token = security._decode_token(token=access_token)

    # Временно убрана проверка прав доступа
    request_data = await session.execute(select(ComplaintModel))

    all_complaints = request_data.scalars().all()

    if not all_complaints:
        return {"message": "No Complaints found"}

    count_dict = {
        "chat": 0,
        "profile": 0,
        "request": 0,
    }

    if all_complaints:
        for compl in all_complaints:
            complaint_type = compl.complaint_type
            if complaint_type in count_dict:
                count_dict[complaint_type] += 1

    return count_dict


@admin_router.post("/{role}")
async def admin_panel(session: SessionDep, role: str, authorization: str = Header(None)):
    """Список жалоб"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Token is not given")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")

    access_token = authorization.split()[1]
    access_token = security._decode_token(token=access_token)

    # Временно убрана проверка прав доступа
    request_data = await session.execute(select(ComplaintModel))

    all_complaints = request_data.scalars().all()

    active_complaints = {}
    completed_complaints = {}

    for compl in all_complaints:
        complaints_dict = {
            "id": compl.id,
            "complaint_type": compl.complaint_type,
            "complaint_text": compl.complaint_text,
            "complainant_id": compl.complainant_id,
            "suspect_id": compl.suspect_id,
            "request_id": compl.request_id,
            "details": compl.details,
            "ai_response": compl.ai_response,
            "status": compl.status,
            "admin_id": compl.admin_id,
            "admin_verdict": compl.admin_verdict,
            "created_at": compl.created_at,
        }

        if compl.status != "closed":
            active_complaints[str(compl.id)] = complaints_dict

        elif compl.status == "closed":
            completed_complaints[str(compl.id)] = complaints_dict

    if not all_complaints:
        return {"message": "No Complaints found"}

    latest_active = dict(sorted(active_complaints.items(), key=lambda x: int(x[0]), reverse=True)[:3])
    latest_completed = dict(sorted(completed_complaints.items(), key=lambda x: int(x[0]), reverse=True)[:3])

    return {
        "active_complaints": latest_active if latest_active else {},
        "completed_complaints": latest_completed if latest_completed else {},
    }


@admin_router.post("/{option}/{complaint_id}")
async def edit_complaint(session: SessionDep, option: str, complaint_id: int, authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token is not given")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")

    access_token = authorization.split()[1]
    access_token = security._decode_token(token=access_token)

    status_decipher = {
        "pend": "pending",
        "complete": "closed",
    }

    punish_service = PunishService(session=session)

    # Временно убрана проверка прав доступа
    if option == "delete":
        await punish_service.delete_complaint(complaint_id)
    elif option in ["cancel", "complete"]:
        await punish_service.edit_complaint_status(complaint_id, status_decipher[option])


@admin_router.post("/punish")
async def punish_user(
        session: SessionDep,
        punishment_info: PunishmentRequest,
        authorization: str = Header(None),
):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token is not given")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")

    access_token = authorization.split()[1]
    access_token = security._decode_token(token=access_token)

    # Временно убрана проверка прав доступа
    punish_service = PunishService(session=session)

    success = []

    for user in punishment_info["punishment"]:
        if user.verdict == "ban":
            user["is_given"] = (await punish_service.ban_user(user.user_id))["is_given"]

        elif user.verdict == "warning":
            user["is_given"] = (await punish_service.warn_user(user.user_id))["is_given"]

        elif user.verdict == "innocent":
            user["is_given"] = True

        success.append(user)

    punishment_info["punishment"] = success

    return punishment_info


