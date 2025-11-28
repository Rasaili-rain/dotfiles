#!/usr/bin/env python

# For this shebang to work correctly, you must run the script from the project root 
# and ensure the file has execute permissions (e.g., 'chmod +x main.py && ./main.py').

import uvicorn
if __name__ == "__main__":
    uvicorn.run("src.server:app", host="127.0.0.1", port=8000, reload=True)