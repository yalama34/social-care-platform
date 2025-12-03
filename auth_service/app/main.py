from fastapi import FastAPI, HTTPException, Header
from routers import router, security, config
from shared.database import engine, SessionDep
from shared.models import Base
from shared.models import UserModel, RefreshToken
from contextlib import asynccontextmanager
from service import TokenService
from datetime import datetime
from sqlalchemy import select
from fastapi.middleware.cors import CORSMiddleware
import jwt




@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        # await conn.run_sync(Base.metadata.drop_all) # Чистит всю БД, ОПАСНО!!!
        await conn.run_sync(Base.metadata.create_all)
    print("✅ БД создана")
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")


@app.post("/refresh")
async def check_session(session: SessionDep, authorization: str = Header(None)) -> dict:
    if not authorization:
        raise HTTPException(status_code=401, detail="Token is not given")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")
    access_token_str = authorization.split()[1]
    try:
        access_token = jwt.decode(
            access_token_str,
            config.JWT_SECRET_KEY,
            algorithms=["HS256"],
            options={"verify_exp": False}
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    result = await session.execute(
        select(UserModel).where(UserModel.id == access_token.get("user_id"))
    )
    user = result.scalar()
    if not user:
        return {
            "session_active": False,
        }
    result = await session.execute(select(RefreshToken).where(RefreshToken.user_id == user.id))
    refresh_token = result.scalar()
    token = TokenService(session)
    check_refresh_token = await token.validate_refresh_token(refresh_token.token)
    if refresh_token.is_revoked:
        raise HTTPException(status_code=403, detail="You have been banned")
    if access_token.get("expires_at") < int(datetime.now().timestamp()):
        if not check_refresh_token:
            return {
                "session_active": False,
            }
        new_access_token = await token.create_access_token(user_id=user.id, security=security)
        return {
            "session_active": True,
            "access_token": new_access_token,
            "role": refresh_token.role,
            "full_name": user.full_name,
        }
    return{
        "session_active": True,
        "access_token": access_token_str,
        "role": access_token.get("role"),
        "full_name": user.full_name,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
