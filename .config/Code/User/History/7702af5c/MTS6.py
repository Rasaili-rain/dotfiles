#!/usr/bin/env python

# NOTE: The most direct way to reference the 'uv' generated python interpreter 
# without knowing the absolute path is to use the environment's path: .venv/bin/python.
# For this shebang to work correctly, you must run the script from the project root 
# and ensure the file has execute permissions (e.g., 'chmod +x main.py').

import uvicorn
if __name__ == "__main__":
    uvicorn.run("src.server:app", host="127.0.0.1", port=8000, reload=True)