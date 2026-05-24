from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
from dotenv import load_dotenv
import os

load_dotenv("../.env")

app = FastAPI(title="360°")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

@app.get("/health")
def health():
    return {"status": "ok", "app": "360°"}

@app.get("/clients")
def get_clients():
    result = supabase.table("clients").select("*").execute()
    return result.data
