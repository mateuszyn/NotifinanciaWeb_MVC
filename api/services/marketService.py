from typing import Any, Dict, List, Optional
import re

import pandas as pd
import requests
import yfinance as yf


def _should_append_sa(symbol: str) -> bool:
    sym = symbol.upper()
    if sym.endswith(".SA"):
        return False
    # If symbol already contains a dot (country suffix or special), treat as global
    if "." in sym:
        return False
    # Heuristic: B3 tickers usually contain digits (e.g., PETR4, VALE3, EQPA3)
    if any(ch.isdigit() for ch in sym):
        return True
    # If symbol contains only letters and is longer than 4 it's likely a local code
    if sym.isalpha() and len(sym) >= 5:
        return True
    return False


def _build_query_symbol(original: str) -> str:
    if _should_append_sa(original):
        return f"{original}.SA"
    return original


def get_market_data(symbols: List[str]) -> Dict[str, Dict[str, Any]]:
    if not symbols:
        return {}

    # prepare mapping from original symbol to queried symbol (may include .SA)
    mapping: Dict[str, str] = {s: _build_query_symbol(s) for s in symbols}
    query_symbols = list(mapping.values())

    # try a batch download to speed up close price retrieval
    batch_data: Optional[pd.DataFrame] = None
    try:
        batch_data = yf.download(
            query_symbols,
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
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
    })

    results: Dict[str, Dict[str, Any]] = {}

    for original_symbol, query_symbol in mapping.items():
        try:
            tk = yf.Ticker(query_symbol, session=session)
            history = tk.history(period="2d", auto_adjust=False)

            price: Optional[float] = None
            change_percent: Optional[float] = None

            if not history.empty:
                price = float(history["Close"].iloc[-1])
                if len(history) >= 2:
                    previous = float(history["Close"].iloc[-2])
                    if previous > 0:
                        change_percent = round(((price - previous) / previous) * 100, 2)

            # fallback to batch data
            if price is None and batch_data is not None:
                if isinstance(batch_data.columns, pd.MultiIndex):
                    for col in batch_data.columns:
                        # col is like ("Close", "TICKER.SA")
                        if col[0] == "Close" and col[1] == query_symbol:
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
                    if isinstance(close_series, pd.Series) and not close_series.empty:
                        price = float(close_series.iloc[-1])
                        if len(close_series) >= 2:
                            previous = float(close_series.iloc[-2])
                            if previous > 0:
                                change_percent = round(((price - previous) / previous) * 100, 2)

            # yield calculation
            yieldpct = 0.0
            try:
                info = getattr(tk, "info", None) or {}
                dividend_yield = info.get("dividendYield")
                trailing_yield = info.get("trailingAnnualDividendYield")

                raw_yield = dividend_yield if dividend_yield not in (None, 0) else trailing_yield
                if raw_yield is None:
                    raise ValueError("yield empty")

                yieldpct = float(raw_yield)
                if yieldpct > 1:
                    yieldpct = yieldpct
                elif yieldpct > 0:
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
                        h = tk.history(period="1d", auto_adjust=False)
                        current_price = float(h["Close"].iloc[-1]) if not h.empty else None

                    if current_price is None or current_price <= 0:
                        raise ValueError("no price")

                    yieldpct = round((total_dividends / current_price) * 100, 2)
                except Exception:
                    yieldpct = 0.0

            results[original_symbol] = {
                "ticker": original_symbol,
                "price": price,
                "changePercent": change_percent,
                "yieldpct": yieldpct,
            }
        except Exception:
            results[original_symbol] = {
                "ticker": original_symbol,
                "price": None,
                "changePercent": None,
                "yieldpct": None,
                "error": "Falha ao consultar o ticker.",
            }

    return results
