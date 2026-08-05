from typing import Any, Dict, List

import pandas as pd
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

    results: Dict[str, Dict[str, Any]] = {}

    for symbol in symbols:
        try:
            ticker = yf.Ticker(symbol)
            history = ticker.history(period="2d", auto_adjust=False)

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

            fast_info = getattr(ticker, "fast_info", None)
            yieldpct = 0.0
            if fast_info:
                dividend_yield = fast_info.get("dividendYield")
                trailing_yield = fast_info.get("trailingAnnualDividendYield")

                if dividend_yield is None and trailing_yield is None:
                    yieldpct = 0.0
                else:
                    raw_yield = dividend_yield if dividend_yield not in (None, 0) else trailing_yield
                    if raw_yield is None:
                        yieldpct = 0.0
                    else:
                        yieldpct = round(float(raw_yield) * 100, 2)

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
