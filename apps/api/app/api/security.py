from fastapi import APIRouter,Depends,Request
from pydantic import BaseModel,Field
from app.api.dependencies import get_auth_context
from app.core.config import get_settings
from app.core.security import client_ip,security_hash
from app.core.supabase_rest import rpc,select,update
router=APIRouter(prefix="/api/v1/security",tags=["Security"])
class DeviceRegistration(BaseModel):device_label:str=Field(min_length=1,max_length=120)
class SessionRevocation(BaseModel):reason:str=Field(default="manual",min_length=1,max_length=200)
@router.get("/devices")
async def devices(context:dict=Depends(get_auth_context)):return await select(context["user"],"security_devices",{"select":"id,device_label,last_seen_at,first_seen_at,revoked_at","order":"last_seen_at.desc"})
@router.post("/devices",status_code=201)
async def register_device(payload:DeviceRegistration,request:Request,context:dict=Depends(get_auth_context)):
 s=get_settings()
 if not s.security_pepper:raise RuntimeError("ALLPHA_SECURITY_PEPPER must be configured.")
 ua=request.headers.get("user-agent","unknown")
 return await rpc(context["user"],"register_security_device",{"p_device_label":payload.device_label,"p_user_agent_hash":security_hash(ua,s.security_pepper),"p_ip_hash":security_hash(client_ip(request),s.security_pepper)})
@router.post("/devices/{device_id}/revoke")
async def revoke_device(device_id:str,context:dict=Depends(get_auth_context)):rows=await select(context["user"],"security_devices",{"select":"id","id":f"eq.{device_id}","user_id":f"eq.{context['user'].user_id}","limit":"1"})
 if not rows:return {"status":"not_found"}
 return await update(context["user"],"security_devices",{"id":f"eq.{device_id}","user_id":f"eq.{context['user'].user_id}"},{"revoked_at":__import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat()})
\n@router.post("/sessions/{session_id}/revoke",status_code=201)\nasync def revoke_session(session_id:str,payload:SessionRevocation,context:dict=Depends(get_auth_context)):\n return await rpc(context["user"],"revoke_security_session",{"p_session_id":session_id,"p_reason":payload.reason})\n