import urllib.request
import json

url = "http://localhost:3000/api/market-data?tickers=PETR4.SA"
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    response = urllib.request.urlopen(req)
    data = json.loads(response.read().decode('utf-8'))
    print("API Response:", json.dumps(data, indent=2))
except Exception as e:
    print("Error calling API:", str(e))
