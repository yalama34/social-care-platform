from sqlalchemy import select
from ..common.models import UserRating
from fastapi import HTTPException


class RatingService:
    def __init__(self, session):
        self.session = session


    async def get_rating_by_user_id(self, user_id: int):
        data = await self.session.execute(select(UserRating).where(UserRating.user_id == user_id))
        user_rating = data.scalar()
        print("!!! ЖОПА", user_rating)
        if not user_rating:
            return {
                "rating": 0.0,
                "rating_count": 0,
            }
        return {
            "rating": user_rating.average_rating,
            "rating_count": user_rating.rating_count,
        }
