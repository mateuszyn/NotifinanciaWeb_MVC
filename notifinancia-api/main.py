from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
from datetime import datetime, timezone

app = FastAPI(title="Notifinancia Market Data API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/ping")
def ping():
    return {"status": "Acordado e operando!"}


def _format_ex_dividend_date(value):
    if value in (None, ""):
        return None

    if isinstance(value, (int, float)):
        return int(value)

    if isinstance(value, str):
        try:
            if value.isdigit():
                return int(value)
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
            return int(parsed.replace(tzinfo=timezone.utc).timestamp())
        except Exception:
            return value

    if hasattr(value, "timestamp"):
        try:
            return int(value.timestamp())
        except Exception:
            return str(value)

    return str(value)


@app.get("/market-data")
def get_market_data(tickers: str = Query(..., description="Tickers separados por vírgulas")):
    if not tickers or not tickers.strip():
        return {"results": {}}

    raw_tickers = [item.strip() for item in tickers.split(",") if item.strip()]
    results = {}

    for ticker in raw_tickers:
        normalized_ticker = ticker.replace(".SA", "").replace(".sa", "").strip().upper()

        try:
            info = yf.Ticker(ticker).info or {}

            price = info.get("currentPrice") or info.get("regularMarketPrice") or info.get("previousClose")
            change_percent = info.get("regularMarketChangePercent")
            raw_yield = info.get("dividendYield") or 0.0

            if raw_yield < 1.0:
                yield_pct = round(raw_yield * 100, 2)
            else:
                yield_pct = round(raw_yield, 2)

            results[normalized_ticker] = {
                "price": round(float(price), 2) if price is not None else None,
                "changePercent": round(float(change_percent), 2) if change_percent is not None else None,
                "yieldpct": yield_pct,
                "exDividendDate": _format_ex_dividend_date(info.get("exDividendDate")),
            }
        except Exception as exc:
            results[normalized_ticker] = {
                "price": None,
                "changePercent": None,
                "yieldpct": None,
                "exDividendDate": None,
                "error": str(exc),
            }

    return {"results": results}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
