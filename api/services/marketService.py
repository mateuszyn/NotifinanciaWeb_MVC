import logging
from typing import Any, Dict, List, Optional

import pandas as pd
import requests
import yfinance as yf

logger = logging.getLogger(__name__)


def _build_session() -> requests.Session:
    session = requests.Session()
    session.headers.update({
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
    })

    try:
        session.get("https://fc.yahoo.com", timeout=5)
    except Exception:
        pass

    return session


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

    session = _build_session()
    results: Dict[str, Dict[str, Any]] = {}

    for original_symbol, query_symbol in mapping.items():
        try:
            tk = yf.Ticker(query_symbol, session=session)
            history = tk.history(period="5d", auto_adjust=False)

            price: Optional[float] = None
            change_percent: Optional[float] = None

            if not history.empty:
                close_series = pd.to_numeric(history.get("Close"), errors="coerce").dropna()
                if not close_series.empty:
                    price = float(close_series.iloc[-1])
                    if len(close_series) >= 2:
                        previous = float(close_series.iloc[-2])
                        if previous > 0:
                            change_percent = round(((price - previous) / previous) * 100, 2)

            # fallback to batch data
            if price is None and batch_data is not None:
                if isinstance(batch_data.columns, pd.MultiIndex):
                    for col in batch_data.columns:
                        if col[0] == "Close" and col[1] == query_symbol:
                            close_series = pd.to_numeric(batch_data[col], errors="coerce").dropna()
                            if not close_series.empty:
                                price = float(close_series.iloc[-1])
                                if len(close_series) >= 2:
                                    previous = float(close_series.iloc[-2])
                                    if previous > 0:
                                        change_percent = round(((price - previous) / previous) * 100, 2)
                                break
                elif "Close" in batch_data.columns:
                    close_series = pd.to_numeric(batch_data["Close"], errors="coerce").dropna()
                    if isinstance(close_series, pd.Series) and not close_series.empty:
                        price = float(close_series.iloc[-1])
                        if len(close_series) >= 2:
                            previous = float(close_series.iloc[-2])
                            if previous > 0:
                                change_percent = round(((price - previous) / previous) * 100, 2)

            if price is None:
                results[original_symbol] = {
                    "ticker": original_symbol,
                    "price": None,
                    "changePercent": None,
                    "yieldpct": 0.0,
                    "error": "Preço indisponível no Yahoo Finance.",
                }
                continue

            price = float(price)
            if price <= 0:
                results[original_symbol] = {
                    "ticker": original_symbol,
                    "price": None,
                    "changePercent": change_percent,
                    "yieldpct": 0.0,
                    "error": "Preço inválido ou igual a zero.",
                }
                continue

            yieldpct = 0.0
            try:
                info = getattr(tk, "info", None) or {}
                dividend_yield = info.get("dividendYield")
                trailing_yield = info.get("trailingAnnualDividendYield")

                raw_yield = dividend_yield if dividend_yield not in (None, 0) else trailing_yield
                if raw_yield is not None:
                    yieldpct = float(raw_yield)
                    if 0 < yieldpct < 1:
                        yieldpct = yieldpct * 100
                    yieldpct = round(yieldpct, 2)
            except Exception as exc:
                logger.warning("Falha ao obter yield via info para %s: %s", query_symbol, exc)

            if yieldpct == 0.0:
                try:
                    dividends = getattr(tk, "dividends", None)
                    if dividends is None:
                        raise ValueError("dividends not found")

                    if not isinstance(dividends, pd.Series):
                        dividends = pd.Series(dividends)

                    if dividends.empty:
                        raise ValueError("dividends empty")

                    cutoff = pd.Timestamp.now().normalize() - pd.DateOffset(years=1)
                    recent_dividends = dividends[dividends.index >= cutoff]
                    if recent_dividends.empty:
                        raise ValueError("no recent dividends in last 12 months")

                    total_dividends = float(pd.to_numeric(recent_dividends, errors="coerce").sum())
                    yieldpct = round((total_dividends / price) * 100, 2)
                except Exception as fallback_exc:
                    logger.warning("Fallback de dividendos falhou para %s: %s", query_symbol, fallback_exc)
                    yieldpct = 0.0

            results[original_symbol] = {
                "ticker": original_symbol,
                "price": price,
                "changePercent": change_percent,
                "yieldpct": yieldpct,
            }
        except Exception as exc:
            logger.warning("Falha ao consultar o ticker %s: %s", query_symbol, exc)
            results[original_symbol] = {
                "ticker": original_symbol,
                "price": None,
                "changePercent": None,
                "yieldpct": 0.0,
                "error": "Falha ao consultar o ticker.",
            }

    return results
