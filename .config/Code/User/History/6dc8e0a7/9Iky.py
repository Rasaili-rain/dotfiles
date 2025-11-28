# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GOOGLE_CLIENT_ID = "your-google-client-id.apps.googleusercontent.com"

class GoogleLogin(BaseModel):
    token: str

@app.post("/auth/google")
async def google_login(data: GoogleLogin):
    try:
        # Verify Google token
        idinfo = id_token.verify_oauth2_token(
            data.token, 
            requests.Request(), 
            GOOGLE_CLIENT_ID
        )
        
        # Get user info
        user = {
            "email": idinfo["email"],
            "name": idinfo["name"],
            "picture": idinfo["picture"]
        }
        
        return {"user": user, "message": "Login successful"}
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/")
async def root():
    return {"message": "API running"}