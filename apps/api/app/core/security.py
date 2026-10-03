from __future__ import annotations
import hashlib,hmac,ipaddress,re,time,secrets
from collections import defaultdict,deque
from urllib.parse import urlsplit
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
PRIVATE=(ipaddress.ip_network("10.0.0.0/8"),ipaddress.ip_network("172.16.0.0/12"),ipaddress.ip_network("192.168.0.0/16"),ipaddress.ip_network("127.0.0.0/8"),ipaddress.ip_network("169.254.0.0/16"),ipaddress.ip_network("::1/128"),ipaddress.ip_network("fc00::/7"),ipaddress.ip_network("fe80::/10"))
PROMPTS=(r"ignore\\s+(all\\s+)?previous\\s+instructions",r"reveal\\s+(the\\s+)?system\\s+prompt",r"developer\\s+message",r"bypass\\s+(the\\s+)?safety",r"disable\\s+(security|guardrails)",r"jailbreak")
class SecurityViolation(Exception):
 def __init__(self,code,message="Security policy rejected the request."):self.code,self.message=code,message
def security_hash(value,pepper):return hmac.new(pepper.encode(),value.encode(),hashlib.sha256).hexdigest()
def client_ip(request):return request.client.host if request.client else "unknown"
def validate_external_url(value,allowed_schemes=("https",),allow_hosts=None):
 if len(value)>2048:raise SecurityViolation("URL_TOO_LONG")
 p=urlsplit(value)
 if p.scheme.lower() not in allowed_schemes or not p.hostname or p.username or p.password:raise SecurityViolation("URL_INVALID")
 try:a=ipaddress.ip_address(p.hostname)
 except ValueError:a=None
 if a and any(a in n for n in PRIVATE):raise SecurityViolation("URL_PRIVATE_NETWORK_BLOCKED")
 if allow_hosts and p.hostname.lower() not in {x.lower() for x in allow_hosts}:raise SecurityViolation("URL_HOST_NOT_ALLOWED")
 return value
def validate_upload(filename,content_type,size,max_bytes,allowed_types):
 name=filename.replace("\\\\","/").split("/")[-1]
 if size<0 or size>max_bytes or not name or name.startswith(".") or len(name)>180:raise SecurityViolation("UPLOAD_INVALID")
 if ".." in name or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._ -]*",name):raise SecurityViolation("UPLOAD_FILENAME_INVALID")
 if content_type.lower() not in allowed_types:raise SecurityViolation("UPLOAD_CONTENT_TYPE_NOT_ALLOWED")
 if re.search(r"\\.(php|phtml|phar|exe|dll|js|mjs|html|htm|svg)$",name,re.I):raise SecurityViolation("UPLOAD_ACTIVE_CONTENT_BLOCKED")
def prompt_injection_risk(text):
 if not text or len(text)>200000:return True
 return any(re.search(p,text,re.I) for p in PROMPTS)
def require_safe_prompt(text):
 if prompt_injection_risk(text):raise SecurityViolation("PROMPT_INJECTION_RISK")
class SlidingWindowLimiter:
 def __init__(self,limit,window):self.limit,self.window,self.hits=limit,window,defaultdict(deque)
 def allow(self,key):
  now=time.monotonic();q=self.hits[key]
  while q and q[0]<now-self.window:q.popleft()
  if len(q)>=self.limit:return False
  q.append(now);return True
GLOBAL_LIMITER=SlidingWindowLimiter(240,60);SENSITIVE_LIMITER=SlidingWindowLimiter(30,60)
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
 async def dispatch(self,request,call_next):
  path=request.url.path;ip=client_ip(request)
  limiter=SENSITIVE_LIMITER if any(path.startswith(x) for x in ("/api/v1/auth","/api/v1/payments","/api/v1/payouts","/api/v1/agent-runtime","/api/v1/ai")) else GLOBAL_LIMITER
  if not limiter.allow(f"{ip}:{path.split('/')[3] if len(path.split('/'))>3 else path}"):return JSONResponse(429,{"detail":{"code":"RATE_LIMITED","message":"Too many requests."}},headers={"Retry-After":"60"})
  if request.method in {"POST","PUT","PATCH","DELETE"}:
   origin=request.headers.get("origin")
   if origin and not (origin.startswith("http://localhost:3000") or origin.startswith("http://localhost:3001") or origin.startswith("https://")):return JSONResponse(403,{"detail":{"code":"ORIGIN_BLOCKED","message":"Request origin is not allowed."}})
  cl=request.headers.get("content-length")
  if cl:
   try:
    if int(cl)>10*1024*1024:return JSONResponse(413,{"detail":{"code":"REQUEST_TOO_LARGE","message":"Request body is too large."}})
   except ValueError:return JSONResponse(400,{"detail":{"code":"INVALID_CONTENT_LENGTH","message":"Invalid Content-Length."}})
  response=await call_next(request)
  response.headers["X-Request-ID"]=request.headers.get("X-Request-ID",secrets.token_hex(16))
  for k,v in {"X-Content-Type-Options":"nosniff","X-Frame-Options":"DENY","Referrer-Policy":"strict-origin-when-cross-origin","Permissions-Policy":"camera=(),microphone=(),geolocation=(),payment=()","Cross-Origin-Opener-Policy":"same-origin","Cross-Origin-Resource-Policy":"same-site"}.items():response.headers[k]=v
  response.headers["Content-Security-Policy"]="default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'; form-action 'self'; img-src 'self' data: blob: https:; media-src 'self' blob: https:; connect-src 'self' https: wss:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  return response
