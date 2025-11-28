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

# --- CONFIGURATION ---
# Replace these with the values from your JSON file
GOOGLE_CLIENT_ID = "561881653940-03no1890plvl8l6vtb90nvo1d5kflh8c.apps.googleusercontent.com"         # From your JSON "client_id"
GOOGLE_CLIENT_SECRET = "YOUR_CLIENT_SECRET" # From your JSON "client_secret"

# These are standard Google endpoints (found in your JSON as auth_uri and token_uri)
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v1/userinfo"

# App settings
SECRET_KEY = "your_super_secret_key_for_jwt" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
FRONTEND_URL = "http://localhost:5173"

app = FastAPI()

# --- CORS (Allow Frontend to talk to Backend) ---
origins = [
    "http://localhost:5173", # Vite default port
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODELS ---
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
    return User(email=email)

# --- OAUTH ROUTES ---

@app.get("/login/google")
async def login_google():
    """Constructs the Google Login URL."""
    params = {
        "response_type": "code",
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": "http://localhost:8000/auth/google/callback",
        "scope": "openid profile email",
        "access_type": "offline"
    }
    # Create the query string manually or using a library
    query_string = "&".join([f"{key}={value}" for key, value in params.items()])
    return {"url": f"{GOOGLE_AUTH_URL}?{query_string}"}

@app.get("/auth/google/callback")
async def auth_google_callback(code: str):
    """Exchanges the Google code for a token."""
    data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": "http://localhost:8000/auth/google/callback",
        "grant_type": "authorization_code",
    }
    
    async with httpx.AsyncClient() as client:
        # 1. Exchange code for Google Token
        response = await client.post(GOOGLE_TOKEN_URL, data=data)
        response_json = response.json()
        
        if "access_token" not in response_json:
            # Better error handling: print what Google sent back
            print(f"Google Error: {response_json}") 
            raise HTTPException(status_code=400, detail="Failed to retrieve access token from Google")
            
        access_token = response_json["access_token"]
        
        # 2. Get User Info from Google
        user_info_response = await client.get(GOOGLE_USERINFO_URL, headers={"Authorization": f"Bearer {access_token}"})
        user_info = user_info_response.json()
    
    # 3. Create Session/JWT for OUR app
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    app_token = create_access_token(
        data={"sub": user_info["email"], "name": user_info.get("name"), "picture": user_info.get("picture")},
        expires_delta=access_token_expires
    )
    
    # 4. Redirect back to frontend
    return RedirectResponse(url=f"{FRONTEND_URL}?token={app_token}")

@app.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user