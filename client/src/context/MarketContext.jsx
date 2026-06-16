import React, { createContext, useContext, useState } from 'react';

export const MarketContext = createContext();

export const MARKETS = {
  US: {
    id: 'US',
    name: 'US Stocks',
    flag: '🇺🇸',
    currency: 'USD',
    symbol: '$',
    exchange: 'NYSE / NASDAQ',
    hours: '9:30 AM – 4:00 PM ET',
    symbols: ['AAPL', 'TSLA', 'NVDA', 'AMZN', 'MSFT', 'GOOGL', 'META', 'NFLX', 'AMD', 'INTC'],
    isOpen: true,
  },
  IN: {
    id: 'IN',
    name: 'Indian Stocks',
    flag: '🇮🇳',
    currency: 'INR',
    symbol: '₹',
    exchange: 'NSE / BSE',
    hours: '9:15 AM – 3:30 PM IST',
    symbols: ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'WIPRO', 'ICICIBANK', 'KOTAKBANK', 'BAJFINANCE', 'HINDUNILVR', 'ITC'],
    isOpen: false,
  },
  CRYPTO: {
    id: 'CRYPTO',
    name: 'Crypto',
    flag: '₿',
    currency: 'USD',
    symbol: '$',
    exchange: '24/7 Global',
    hours: '24 hours / 7 days',
    symbols: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'AVAX', 'DOT', 'LINK', 'MATIC'],
    isOpen: true,
  },
  FOREX: {
    id: 'FOREX',
    name: 'Forex',
    flag: '💱',
    currency: 'USD',
    symbol: '$',
    exchange: 'Global OTC',
    hours: 'Mon–Fri, 24 hours',
    symbols: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'EUR/GBP', 'USD/CHF', 'NZD/USD'],
    isOpen: true,
  },
  ETF: {
    id: 'ETF',
    name: 'ETFs',
    flag: '📦',
    currency: 'USD',
    symbol: '$',
    exchange: 'NYSE / NASDAQ',
    hours: '9:30 AM – 4:00 PM ET',
    symbols: ['SPY', 'QQQ', 'IWM', 'DIA', 'ARKK', 'GLD', 'TLT', 'HYG', 'VXX', 'XLK'],
    isOpen: true,
  },
  COMMODITIES: {
    id: 'COMMODITIES',
    name: 'Commodities',
    flag: '🛢️',
    currency: 'USD',
    symbol: '$',
    exchange: 'CME / NYMEX',
    hours: 'Sun–Fri, 23 hours',
    symbols: ['GOLD', 'SILVER', 'CRUDE_OIL', 'NAT_GAS', 'COPPER', 'WHEAT', 'CORN', 'SOYBEANS'],
    isOpen: true,
  },
};

export const MarketProvider = ({ children }) => {
  const [activeMarket, setActiveMarket] = useState('US');

  const market = MARKETS[activeMarket];

  const switchMarket = (marketId) => {
    if (MARKETS[marketId]) {
      setActiveMarket(marketId);
    }
  };

  return (
    <MarketContext.Provider value={{ activeMarket, market, switchMarket, MARKETS }}>
      {children}
    </MarketContext.Provider>
  );
};

export const useMarket = () => {
  const context = useContext(MarketContext);
  if (!context) throw new Error('useMarket must be used within MarketProvider');
  return context;
};

export default MarketProvider;
