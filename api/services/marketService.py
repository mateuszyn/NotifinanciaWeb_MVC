from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional

import requests

logger = logging.getLogger(__name__)

DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json,text/plain,*/*",
    "Accept-Language": "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7",
    "Connection": "keep-alive",
}

def _should_append_sa(symbol: str) -> bool:
    sym = symbol.upper()
    if sym.endswith(".SA"):
        return False
    if "." in sym:
        return False
    if any(ch.isdigit() for ch in sym):
        return True
    if sym.isalpha() and len(sym) >= 5:
        return True
    return False

def _build_query_symbol(original: str) -> str:
    if _should_append_sa(original):
        return f"{original}.SA"
    return original

def _fetch_chart_payload(session: requests.Session, query_symbol: str) -> Optional[Dict[str, Any]]:
    # Ampliado para range=2y para capturar o histórico completo de proventos sem falhas de corte de data
    url = f"https://query2.finance.yahoo.com/v8/finance/chart/{query_symbol}?interval=1d&range=2y&events=div"
    try:
        response = session.get(url, headers=DEFAULT_HEADERS, timeout=15)
        response.raise_for_status()
        payload = response.json()
        chart = payload.get("chart") or {}
        result = (chart.get("result") or [])
        if not result:
            return None
        return result[0]
    except Exception as exc:
        logger.warning("Falha ao consultar Yahoo Finance Chart para %s: %s", query_symbol, exc)
        return None

def get_market_data(symbols: List[str]) -> Dict[str, Dict[str, Any]]:
    if not symbols:
        return {}

    mapping = {symbol: _build_query_symbol(symbol) for symbol in symbols}
    session = requests.Session()
    session.headers.update(DEFAULT_HEADERS)

    try:
        session.get("https://fc.yahoo.com", timeout=5)
    except Exception:
        pass

    results: Dict[str, Dict[str, Any]] = {}

    now_timestamp = int(datetime.now(timezone.utc).timestamp())
    one_year_ago_timestamp = now_timestamp - (365 * 24 * 60 * 60)

    for original_symbol, query_symbol in mapping.items():
        price: Optional[float] = None
        change_percent: Optional[float] = None
        yieldpct = 0.0
        paid_months: List[int] = []

        try:
            result = _fetch_chart_payload(session, query_symbol)
            if not result:
                results[original_symbol] = {
                    "ticker": original_symbol,
                    "price": None,
                    "changePercent": None,
                    "yieldpct": 0.0,
                    "paidMonths": [],
                }
                continue

            meta = result.get("meta") or {}
            price_value = meta.get("regularMarketPrice")
            if price_value is not None:
                price = float(price_value)

            # Variação diária
            indicators = result.get("indicators") or {}
            quote_list = indicators.get("quote") or [{}]
            closes = quote_list[0].get("close") or []
            valid_closes = [c for c in closes if c is not None]

            if price is not None and len(valid_closes) >= 2:
                previous_close = float(valid_closes[-2])
                if previous_close > 0:
                    change_percent = round(((price - previous_close) / previous_close) * 100, 2)
                    if abs(change_percent) > 50:
                        change_percent = 0.0
            else:
                change_percent = 0.0

            # Processamento de Dividendos (Janela de 2 anos para os meses, 1 ano estrito para o Yield)
            events = result.get("events") or {}
            dividends = events.get("dividends") or {}
            total_dividends = 0.0
            months_set = set()

            if isinstance(dividends, dict):
                for dividend in dividends.values():
                    if not isinstance(dividend, dict):
                        continue
                    amount = dividend.get("amount")
                    date_ts = dividend.get("date")
                    
                    if date_ts is not None:
                        try:
                            dt = datetime.fromtimestamp(int(date_ts), tz=timezone.utc)
                            # Mapeia o mês no histórico de 2 anos para preencher o grid corretamente
                            months_set.add(dt.month)
                            
                            # Soma para o Yield apenas o que está nos últimos 365 dias
                            if int(date_ts) >= one_year_ago_timestamp and amount is not None:
                                total_dividends += float(amount)
                        except (TypeError, ValueError):
                            pass

            paid_months = sorted(list(months_set))

            if price is not None and price > 0 and total_dividends > 0:
                yieldpct = round((total_dividends / price) * 100, 2)

            results[original_symbol] = {
                "ticker": original_symbol,
                "price": price,
                "changePercent": change_percent,
                "yieldpct": yieldpct,
                "paidMonths": paid_months,
            }

        except Exception as exc:
            logger.warning("Erro ao montar dados do ticker %s: %s", query_symbol, exc)
            results[original_symbol] = {
                "ticker": original_symbol,
                "price": None,
                "changePercent": None,
                "yieldpct": 0.0,
                "paidMonths": [],
            }

    return results