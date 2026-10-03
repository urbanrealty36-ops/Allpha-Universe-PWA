import asyncio
import json
import time
from typing import Any
from uuid import UUID

from app.core.ai_gateway import AIGatewayError, GatewayMessage, generate
from app.core.auth import AuthenticatedUser
from app.core.supabase_rest import SupabaseRestError, rpc, select


class AgentRuntimeError(RuntimeError):
    def __init__(self, code: str, message: str, status_code: int = 409) -> None: