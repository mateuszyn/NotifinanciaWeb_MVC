from typing import Any, Dict, List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

try:
    from api.services.marketService import get_market_data
except ImportError:  # pragma: no cover - compatibility for local execution
    from services.marketService import get_market_data

app = FastAPI(title="Notifinancia Market Data API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/ping")
def ping() -> Dict[str, str]:
    return {"status": "Acordado e operando na Vercel!"}


@app.get("/api/market-data")
def market_data(tickers: str) -> Dict[str, Any]:
    symbols = [symbol.strip().upper() for symbol in tickers.split(",") if symbol and symbol.strip()]

    if not symbols:
        return {"results": {}}

    results = get_market_data(symbols)
    return {"results": results}


handler = Mangum(app)
