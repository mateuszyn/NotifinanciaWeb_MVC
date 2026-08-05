from typing import Any, Dict, List

import pandas as pd
import requests
import yfinance as yf
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

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

    batch_data = None
    try:
        batch_data = yf.download(
            symbols,
            period="2d",
            interval="1d",
            auto_adjust=False,
            progress=False,
            threads=True,
        )
    except Exception:
        batch_data = None

    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    })

    results: Dict[str, Dict[str, Any]] = {}

    for symbol in symbols:
        try:
            tk = yf.Ticker(symbol, session=session)
            history = tk.history(period="2d", auto_adjust=False)

            price = None
            change_percent = None

            if not history.empty:
                price = float(history["Close"].iloc[-1])
                if len(history) >= 2:
                    previous = float(history["Close"].iloc[-2])
                    if previous > 0:
                        change_percent = round(((price - previous) / previous) * 100, 2)

            if price is None and batch_data is not None:
                if isinstance(batch_data.columns, pd.MultiIndex):
                    for col in batch_data.columns:
                        if col[0] == "Close" and col[1] == symbol:
                            close_series = batch_data[col].dropna()
                            if not close_series.empty:
                                price = float(close_series.iloc[-1])
                                if len(close_series) >= 2:
                                    previous = float(close_series.iloc[-2])
                                    if previous > 0:
                                        change_percent = round(((price - previous) / previous) * 100, 2)
                                break
                elif "Close" in batch_data.columns:
                    close_series = batch_data["Close"].dropna()
                    if isinstance(close_series, pd.Series):
                        if not close_series.empty:
                            price = float(close_series.iloc[-1])
                            if len(close_series) >= 2:
                                previous = float(close_series.iloc[-2])
                                if previous > 0:
                                    change_percent = round(((price - previous) / previous) * 100, 2)

            yieldpct = 0.0
            try:
                info = getattr(tk, "info", None) or {}
                dividend_yield = info.get("dividendYield")
                trailing_yield = info.get("trailingAnnualDividendYield")

                if dividend_yield is None and trailing_yield is None:
                    raise ValueError("yield not available in info")

                raw_yield = dividend_yield if dividend_yield not in (None, 0) else trailing_yield
                if raw_yield is None:
                    raise ValueError("yield empty")

                yieldpct = float(raw_yield)
                if yieldpct > 0 and yieldpct < 1.0:
                    yieldpct = yieldpct * 100
                yieldpct = round(yieldpct, 2)
            except Exception:
                try:
                    dividends = getattr(tk, "dividends", None)
                    if dividends is None or dividends.empty:
                        raise ValueError("no dividends")

                    recent_dividends = dividends.tail(12)
                    if recent_dividends.empty:
                        raise ValueError("no recent dividends")

                    total_dividends = float(recent_dividends.sum())
                    current_price = price
                    if current_price is None or current_price <= 0:
                        current_price = float(tk.history(period="1d", auto_adjust=False)["Close"].iloc[-1]) if not tk.history(period="1d", auto_adjust=False).empty else None

                    if current_price is None or current_price <= 0:
                        raise ValueError("no price")

                    yieldpct = round((total_dividends / current_price) * 100, 2)
                except Exception:
                    yieldpct = 0.0

            results[symbol] = {
                "ticker": symbol,
                "price": price,
                "changePercent": change_percent,
                "yieldpct": yieldpct,
            }
        except Exception:
            results[symbol] = {
                "ticker": symbol,
                "price": None,
                "changePercent": None,
                "yieldpct": None,
                "error": "Falha ao consultar o ticker.",
            }

    return {"results": results}


handler = Mangum(app)
