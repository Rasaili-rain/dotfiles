from typing import Optional
from pydantic import BaseModel

class User(BaseModel):
    email: str
    picture: Optional[str] = None
    name: Optional[str] = None
