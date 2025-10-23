from typing import Annotated
from sqlalchemy import ForeignKey
from fastapi import Depends
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
import datetime


DATABASE_URL = ""


engine = create_async_engine(
    url=DATABASE_URL,
    echo=True,  # Аргумент на логи в терминал
)


new_session = async_sessionmaker(engine, expire_on_commit=False)


async def get_session():
    async with new_session() as session:
        yield session

# Для роутеров, скорее всего стоит перенести
SessionDep = Annotated[AsyncSession, Depends(get_session)]
