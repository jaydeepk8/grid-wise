"""
JWT authentication for GridWise API.
Endpoints: /auth/register, /auth/login, /auth/me
"""

import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from jose import JWTError, jwt
from passlib.context import CryptContext

from api.database import create_user, get_user_by_email, get_user_by_id

# ── Config ─────────────────────────────────────────────────────────────────
SECRET_KEY  = os.environ.get("JWT_SECRET", "gridwise-fallback-secret-change-in-prod")
ALGORITHM   = "HS256"
TOKEN_DAYS  = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer      = HTTPBearer(auto_error=False)
router      = APIRouter(prefix="/auth", tags=["auth"])


# ── Pydantic schemas ────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    name:     str
    email:    str
    password: str

class LoginRequest(BaseModel):
    email:    str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user:         dict


# ── Helpers ─────────────────────────────────────────────────────────────────
def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_token(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "exp": datetime.utcnow() + timedelta(days=TOKEN_DAYS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> Optional[int]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload["sub"])
    except JWTError:
        return None


# ── Dependency: get current user from Bearer token ─────────────────────────
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = decode_token(credentials.credentials)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = get_user_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    """Like get_current_user but returns None instead of raising if no/bad token."""
    if credentials is None:
        return None
    user_id = decode_token(credentials.credentials)
    if user_id is None:
        return None
    return get_user_by_id(user_id)


# ── Routes ──────────────────────────────────────────────────────────────────
@router.post("/register", response_model=TokenResponse)
def register(body: RegisterRequest):
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    user = create_user(
        name          = body.name.strip(),
        email         = body.email.lower().strip(),
        password_hash = hash_password(body.password),
    )
    if user is None:
        raise HTTPException(status_code=409, detail="Email already registered")

    token = create_token(user["id"])
    return TokenResponse(access_token=token, user={"id": user["id"], "name": user["name"], "email": user["email"]})


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest):
    user = get_user_by_email(body.email.lower().strip())
    if user is None or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(user["id"])
    return TokenResponse(
        access_token = token,
        user         = {"id": user["id"], "name": user["name"], "email": user["email"]},
    )


@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    return current_user
