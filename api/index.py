from typing import Any, Dict, List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from .services.marketService import get_market_data


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
    symbols: List[str] = [symbol.strip().upper() for symbol in tickers.split(",") if symbol and symbol.strip()]

    if not symbols:
        return {"results": {}}

    results = get_market_data(symbols)
    normalized_results = {}

    for symbol, payload in results.items():
        normalized_results[symbol] = {
            "ticker": payload.get("ticker", symbol),
            "price": payload.get("price"),
            "changePercent": payload.get("changePercent"),
            "yieldpct": float(payload.get("yieldpct") or 0),
        }

    return {"results": normalized_results}


handler = Mangum(app)
