from fastapi import FastAPI
from .routers.request import request_router
from .routers.home import home_router
from fastapi.middleware.cors import CORSMiddleware
from .routers.feed import feed_router
from .routers.profiles import profile_router
from .routers.websocket import ws_router
from .routers.chat import chat_router
from .routers.moderation import moderation_router
from .routers.verdict import verdict_router
from .routers.rating import rating_router
from .routers.admin import admin_router
from .common.database import engine
from .common.models import Base
from .common import models
from contextlib import asynccontextmanager
from sqlalchemy import text

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Создаем все таблицы
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print("✅ Таблицы созданы/проверены")
    async with engine.begin() as conn:
        try:
            await conn.execute(text("""
                DO $$ 
                BEGIN 
                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name='users' AND column_name='phone'
                    ) AND NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name='users' AND column_name='email'
                    ) THEN
                        ALTER TABLE users RENAME COLUMN phone TO email;
                    END IF;
                END $$;
            """))
            await conn.execute(text("""
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name='requests' AND column_name='destination_address'
                    ) THEN
                        ALTER TABLE requests ADD COLUMN destination_address VARCHAR;
                    END IF;
                END $$;
            """))
            await conn.execute(text("""
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name='requests' AND column_name='list_products'
                    ) THEN
                        ALTER TABLE requests ADD COLUMN list_products VARCHAR;
                    END IF;
                END $$;
            """))
            print("✅ Колонки проверены/добавлены")
        except Exception as e:
            print(f"⚠️ Ошибка при проверке колонок: {e}")
    yield

app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(request_router)
app.include_router(home_router)
app.include_router(feed_router)
app.include_router(profile_router)
app.include_router(ws_router)
app.include_router(chat_router)
app.include_router(moderation_router)
app.include_router(verdict_router)
app.include_router(rating_router)
app.include_router(admin_router)

"""
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=False)
"""