from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from supabase import create_client
from kiteconnect import KiteConnect
from dotenv import load_dotenv
import os

load_dotenv("../.env")

app = FastAPI(title="360")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

KITE_API_KEY = os.getenv("KITE_API_KEY")
KITE_API_SECRET = os.getenv("KITE_API_SECRET")

# Store which client is being linked (in memory)
pending_links = {}

@app.get("/health")
def health():
    return {"status": "ok", "app": "360"}

@app.get("/clients")
def get_clients():
    result = sb.table("clients").select("*").execute()
    return result.data

@app.get("/auth/zerodha/login")
def zerodha_login(client_id: str):
    kite = KiteConnect(api_key=KITE_API_KEY)
    login_url = kite.login_url()
    # Save client_id so we know who this is for when Zerodha calls back
    pending_links["current"] = client_id
    return RedirectResponse(login_url)

@app.get("/auth/zerodha/callback")
def zerodha_callback(request_token: str, status: str = None):
    if status == "cancelled":
        return {"error": "User cancelled login"}

    client_id = pending_links.get("current")
    if not client_id:
        return {"error": "No pending client link found"}

    kite = KiteConnect(api_key=KITE_API_KEY)
    data = kite.generate_session(request_token, api_secret=KITE_API_SECRET)
    access_token = data["access_token"]

    sb.table("accounts").insert({
        "client_id": client_id,
        "broker": "zerodha",
        "label": f"Zerodha - {data.get('user_id', '')}",
    }).execute()

    # Clear pending
    pending_links.pop("current", None)

    return {"message": "Zerodha linked successfully", "user": data.get("user_id")}

@app.get("/holdings/{account_id}")
def get_holdings(account_id: str):
    result = sb.table("holdings").select("*").eq("account_id", account_id).execute()
    return result.data
