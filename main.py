from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from supabase import create_client
from kiteconnect import KiteConnect
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

sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

KITE_API_KEY = os.getenv("KITE_API_KEY")
KITE_API_SECRET = os.getenv("KITE_API_SECRET")

@app.get("/health")
def health():
    return {"status": "ok", "app": "360°"}

@app.get("/clients")
def get_clients():
    result = sb.table("clients").select("*").execute()
    return result.data

# Step 1: Redirect client to Zerodha login page
@app.get("/auth/zerodha/login")
def zerodha_login(client_id: str):
    kite = KiteConnect(api_key=KITE_API_KEY)
    login_url = kite.login_url()
    # We pass client_id in state so we know which client this is for
    return RedirectResponse(f"{login_url}&state={client_id}")

# Step 2: Zerodha sends user back here with a request_token
@app.get("/auth/zerodha/callback")
def zerodha_callback(request_token: str, status: str = None, state: str = None):
    if status == "cancelled":
        return {"error": "User cancelled login"}

    kite = KiteConnect(api_key=KITE_API_KEY)
    data = kite.generate_session(request_token, api_secret=KITE_API_SECRET)
    access_token = data["access_token"]

    # Save the account to database
    sb.table("accounts").insert({
        "client_id": state,
        "broker": "zerodha",
        "label": f"Zerodha - {data.get('user_id', '')}",
    }).execute()

    return {"message": "Zerodha linked successfully", "user": data.get("user_id")}

# Pull holdings for a specific account
@app.get("/holdings/{account_id}")
def get_holdings(account_id: str):
    result = sb.table("holdings").select("*").eq("account_id", account_id).execute()
    return result.data

# Sync holdings from Zerodha for a client
@app.get("/sync/zerodha")
def sync_zerodha(client_id: str, request_token: str):
    kite = KiteConnect(api_key=KITE_API_KEY)
    data = kite.generate_session(request_token, api_secret=KITE_API_SECRET)
    kite.set_access_token(data["access_token"])

    # Get holdings from Zerodha
    holdings = kite.holdings()

    # Get the account for this client
    account = sb.table("accounts").select("id").eq("client_id", client_id).eq("broker", "zerodha").execute()
    if not account.data:
        return {"error": "No Zerodha account found for this client"}

    account_id = account.data[0]["id"]

    # Clear old holdings and insert new ones
    sb.table("holdings").delete().eq("account_id", account_id).execute()

    for h in holdings:
        sb.table("holdings").insert({
            "account_id": account_id,
            "symbol": h["tradingsymbol"],
            "exchange": h["exchange"],
            "qty": h["quantity"],
            "avg_price": h["average_price"],
            "current_price": h["last_price"],
            "pnl": h["pnl"],
            "pnl_pct": round((h["pnl"] / (h["average_price"] * h["quantity"])) * 100, 2) if h["average_price"] and h["quantity"] else 0,
            "instrument_type": h.get("instrument_type", "EQ"),
        }).execute()

    return {"message": f"Synced {len(holdings)} holdings"}
