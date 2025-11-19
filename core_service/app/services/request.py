from datetime import datetime, timedelta
import secrets
from sqlalchemy import select
from core_service.app.models import RequestModel

class RequestService:
    def __init__(self, session):
        self.session = session