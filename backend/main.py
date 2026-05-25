from fastapi import FastAPI
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
    pending_links["current"] = client_id
    return RedirectResponse(kite.login_url())

@app.get("/auth/zerodha/callback")
def zerodha_callback(request_token: str, status: str = None):
    if status == "cancelled":
        return {"error": "User cancelled login"}

    client_id = pending_links.get("current")
    if not client_id:
        return {"error": "No pending client link found"}

    kite = KiteConnect(api_key=KITE_API_KEY)
    data = kite.generate_session(request_token, api_secret=KITE_API_SECRET)

    # Save account WITH access token
    sb.table("accounts").insert({
        "client_id": client_id,
        "broker": "zerodha",
        "label": f"Zerodha - {data.get('user_id', '')}",
        "access_token": data["access_token"],
    }).execute()

    pending_links.pop("current", None)
    return {"message": "Zerodha linked successfully", "user": data.get("user_id")}

# Sync holdings from Zerodha into our database
@app.get("/sync/{client_id}")
def sync_holdings(client_id: str):
    # Get the account for this client
    account = sb.table("accounts").select("*").eq("client_id", client_id).eq("broker", "zerodha").execute()
    if not account.data:
        return {"error": "No Zerodha account found"}

    acc = account.data[0]
    kite = KiteConnect(api_key=KITE_API_KEY)
    kite.set_access_token(acc["access_token"])

    # Pull holdings from Zerodha
    try:
        holdings = kite.holdings()
    except Exception as e:
        return {"error": str(e)}

    # Clear old holdings for this account
    sb.table("holdings").delete().eq("account_id", acc["id"]).execute()

    # Insert fresh holdings
    for h in holdings:
        qty = h.get("quantity", 0)
        avg = h.get("average_price", 0)
        sb.table("holdings").insert({
            "account_id": acc["id"],
            "symbol": h.get("tradingsymbol", ""),
            "exchange": h.get("exchange", ""),
            "qty": qty,
            "avg_price": avg,
            "current_price": h.get("last_price", 0),
            "pnl": h.get("pnl", 0),
            "pnl_pct": round((h["pnl"] / (avg * qty)) * 100, 2) if avg and qty else 0,
            "instrument_type": h.get("instrument_type", "EQ"),
        }).execute()

    # Update last_synced
    sb.table("accounts").update({"last_synced": "now()"}).eq("id", acc["id"]).execute()

    return {"message": f"Synced {len(holdings)} holdings"}

@app.get("/holdings/{client_id}")
def get_holdings(client_id: str):
    accounts = sb.table("accounts").select("id").eq("client_id", client_id).execute()
    if not accounts.data:
        return []
    account_ids = [a["id"] for a in accounts.data]
    all_holdings = []
    for aid in account_ids:
        result = sb.table("holdings").select("*").eq("account_id", aid).execute()
        all_holdings.extend(result.data or [])
    return all_holdings
