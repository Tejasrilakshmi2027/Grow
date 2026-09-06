from app.core.config import settings
from app.providers.base import MarketDataProvider
from app.providers.demo_provider import DemoMarketDataProvider
from app.providers.yahoo_provider import YahooMarketDataProvider

_provider_instance = None

def get_market_data_provider() -> MarketDataProvider:
    global _provider_instance
    if _provider_instance is None:
        if settings.MARKET_DATA_PROVIDER.lower() == "yahoo":
            _provider_instance = YahooMarketDataProvider()
        else:
            _provider_instance = DemoMarketDataProvider()
    return _provider_instance
