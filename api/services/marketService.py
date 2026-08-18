import logging
from typing import Any, Dict, List

import requests

logger = logging.getLogger(__name__)

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/122.0.0.0 Safari/537.36"
)


def _should_append_sa(symbol: str) -> bool:
    sym = symbol.strip().upper()
    if not sym:
        return False
    if sym.endswith(".SA"):
        return False
    if "." in sym:
        return False
    if any(ch.isdigit() for ch in sym):
        return True
    if sym.isalpha() and len(sym) >= 5:
        return True
    return False


def _build_query_symbol(symbol: str) -> str:
    sym = symbol.strip().upper()
    if _should_append_sa(sym):
        return f"{sym}.SA"
    return sym


def get_market_data(symbols: List[str]) -> Dict[str, Dict[str, Any]]:
    if not symbols:
        return {}

    results: Dict[str, Dict[str, Any]] = {}

    for original_symbol in symbols:
        ticker = (original_symbol or "").strip().upper()
        if not ticker:
            continue

        query_symbol = _build_query_symbol(ticker)

        try:
            url = (
                f"https://query2.finance.yahoo.com/v8/finance/chart/{query_symbol}"
                "?interval=1d&range=1y&events=div"
            )
            response = requests.get(
                url,
                headers={
                    "User-Agent": USER_AGENT,
                    "Accept": "application/json,text/plain,*/*",
                    "Accept-Language": "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7",
                },
                timeout=15,
            )
            response.raise_for_status()
            data = response.json()

            result = (data.get("chart") or {}).get("result") or []
            if not result:
                raise ValueError("Nenhum resultado retornado pelo Yahoo Finance")

            meta = result[0].get("meta") or {}
            regular_market_price = meta.get("regularMarketPrice")
            chart_previous_close = meta.get("chartPreviousClose")

            price = 0.0
            if regular_market_price is not None and regular_market_price != 0:
                price = float(regular_market_price)

            change_percent = 0.0
            if chart_previous_close is not None and chart_previous_close != 0:
                previous_close = float(chart_previous_close)
                if previous_close > 0:
                    change_percent = round(((price - previous_close) / previous_close) * 100, 2)

            yieldpct = 0.0
            events = (result[0].get("events") or {})
            dividends = events.get("dividends") or {}

            if isinstance(dividends, dict):
                total_dividends = 0.0
                for dividend in dividends.values():
                    if not isinstance(dividend, dict):
                        continue
                    amount = dividend.get("amount")
                    if amount is None:
                        continue
                    try:
                        total_dividends += float(amount)
                    except (TypeError, ValueError):
                        continue

                if price > 0 and total_dividends > 0:
                    yieldpct = round((total_dividends / price) * 100, 2)

            results[ticker] = {
                "ticker": ticker,
                "price": price,
                "changePercent": change_percent,
                "yieldpct": yieldpct,
            }
        except Exception as exc:
            logger.warning("Falha ao consultar o ticker %s: %s", query_symbol, exc)
            results[ticker] = {
                "ticker": ticker,
                "price": 0.0,
                "changePercent": 0.0,
                "yieldpct": 0.0,
            }

    return results
