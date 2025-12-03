from ..common.database import SessionDep
from ..services.rating import RatingService
from ..common.models import UserRating
from fastapi import APIRouter, HTTPException, Header
from datetime import timedelta
from sqlalchemy import select
from authx import AuthX, AuthXConfig

config = AuthXConfig(
    JWT_SECRET_KEY="secret-key",
    JWT_ACCESS_TOKEN_EXPIRES=timedelta(days=2),
)
security = AuthX(config=config)
rating_router = APIRouter(tags=["rating"])


@rating_router.get("/rating")
async def get_user_rating(session: SessionDep, authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token is not given")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")

    access_token = authorization.split()[1]
    access_token = security._decode_token(token=access_token)

    rating_service = RatingService(session)
    rating_info = await rating_service.get_rating(access_token)

    return rating_info


@rating_router.post("/set-rating")
async def accept_request(session: SessionDep, add_rating: int, authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token is not given")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")

    access_token = authorization.split()[1]
    access_token = security._decode_token(token=access_token)

    try:
        data = await session.execute(select().where(UserRating.user_id == access_token.user_id))
        user_rating = data.scalar()

        if not user_rating:
            user_rating = UserRating(user_id=access_token.user_id)
            session.add(user_rating)

        user_rating.update_rating(add_rating)

        await session.commit()
        await session.refresh(user_rating)

        return {
            "success": True,
        }

    except HTTPException:
        raise

    except Exception:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating rating")
