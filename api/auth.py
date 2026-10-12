import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from passlib.context import CryptContext
from jose import jwt, JWTError
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security_scheme = HTTPBearer()
# Same as above, but doesn't fail on its own when the header is missing
optional_security_scheme = HTTPBearer(auto_error=False)

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
EXPIRE_HOURS = 24


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=EXPIRE_HOURS)
    return jwt.encode({"sub": user_id, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security_scheme)) -> str:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")


def get_current_caller(
    x_service_api_key: Optional[str] = Header(default=None),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        optional_security_scheme),
) -> str:
    """Accepts EITHER a valid user JWT (dashboard) OR a valid
    X-Service-API-Key header (build service / scheduler)."""
    if x_service_api_key is not None:
        expected = os.getenv("SERVICE_API_KEY")
        if not expected:
            raise HTTPException(
                status_code=500, detail="SERVICE_API_KEY not configured")
        if secrets.compare_digest(x_service_api_key, expected):
            return "service"
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid service API key")

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    return get_current_user_id(credentials)
