export async function fetchMarketData() {
    const response = await fetch('https://notifinancia-api.onrender.com/market-data?tickers=EQPA3.SA,GARE11.SA');

    if (!response.ok) {
        throw new Error('Não foi possível carregar os dados do mercado.');
    }

    return response.json();
}
