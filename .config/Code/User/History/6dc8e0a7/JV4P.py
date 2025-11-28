import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.security import OAuth2PasswordBearer
import httpx
from jose import JWTError, jwt
from pydantic import BaseModel

# --- CONFIGURATION (Load these from .env in production) ---
GOOGLE_CLIENT_ID = "561881653940-03no1890plvl8l6vtb90nvo1d5kflh8c.apps.googleusercontent.com"  # Get from Google Cloud Console
GOOGLE_CLIENT_SECRET = "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" # Get from Google Cloud Console
SECRET_KEY = "your_super_secret_key_for_jwt" # specific to your app
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
FRONTEND_URL = "http://localhost:5173"

# Google Endpoints
GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration"

app = FastAPI()

# --- CORS (Allow Frontend to talk to Backend) ---
origins = [
    "http://localhost:5173", # Vite default port
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODELS ---
class Token(BaseModel):
    access_token: str
    token_type: str

class User(BaseModel):
    email: str
    picture: Optional[str] = None
    name: Optional[str] = None

# --- AUTH UTILITIES ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    # In a real app, you would fetch the full user object from DB here
    return User(email=email)

# --- OAUTH ROUTES ---

@app.get("/login/google")
async def login_google():
    """Generates the Google OAuth URL and returns it to the client."""
    return {
        "url": f"https://accounts.google.com/o/oauth2/auth?response_type=code&client_id={GOOGLE_CLIENT_ID}&redirect_uri=http://localhost:8000/auth/google/callback&scope=openid%20profile%20email&access_type=offline"
    }

@app.get("/auth/google/callback")
async def auth_google_callback(code: str):
    """Exchanges the Google code for a token, then creates an App JWT."""
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": "http://localhost:8000/auth/google/callback",
        "grant_type": "authorization_code",
    }
    
    async with httpx.AsyncClient() as client:
        # 1. Exchange code for Google Token
        response = await client.post(token_url, data=data)
        response_json = response.json()
        
        if "access_token" not in response_json:
            raise HTTPException(status_code=400, detail="Failed to retrieve access token from Google")
            
        access_token = response_json["access_token"]
        
        # 2. Get User Info from Google
        user_info_response = await client.get("https://www.googleapis.com/oauth2/v1/userinfo", headers={"Authorization": f"Bearer {access_token}"})
        user_info = user_info_response.json()
    
    # 3. Create Session/JWT for OUR app
    # Here you would typically check if user exists in DB, if not create them.
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    app_token = create_access_token(
        data={"sub": user_info["email"], "name": user_info.get("name"), "picture": user_info.get("picture")},
        expires_delta=access_token_expires
    )
    
    # 4. Redirect back to frontend with the token in URL
    return RedirectResponse(url=f"{FRONTEND_URL}?token={app_token}")

@app.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Protected route example."""
    return current_user