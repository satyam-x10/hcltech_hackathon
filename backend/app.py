# data.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import user  # Make sure this path matches your folder structure

app = FastAPI(
    title="MetaTeller API",
    description="Backend for MetaHuman Bank Teller Avatar",
    version="1.0.0"
)

# Enable CORS to allow frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or ["http://localhost:5173"] for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# health check endpoint
@app.get("/health", tags=["Health Check"])
async def health_check():
    return {"status": "healthy"}


# Register all routers
app.include_router(user.router)
