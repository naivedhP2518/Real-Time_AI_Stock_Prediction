import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, ReferenceLine 
} from 'recharts';
import { io } from 'socket.io-client';
import { ThemeContext } from '../context/ThemeContext';
import API from '../services/api';

// amCharts 5 Imports
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5stock from "@amcharts/amcharts5/stock";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import am5themes_Dark from "@amcharts/amcharts5/themes/Dark";

const QUICK_TICKERS = [
  { symbol: 'AAPL', name: 'Apple' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'NVDA', name: 'Nvidia' },
  { symbol: 'AMZN', name: 'Amazon' }
];

const FullscreenChart = () => {
  const { symbol = 'AAPL' } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [selectedSymbol, setSelectedSymbol] = useState(symbol.toUpperCase());
  const [customSymbol, setCustomSymbol] = useState('');
  const [predictionData, setPredictionData] = useState(null);
  const [livePrice, setLivePrice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab State
  const [activeChartTab, setActiveChartTab] = useState('forecast'); // 'forecast' | 'candlestick'

  // Chart toggles for advanced overlays
  const [showSMA, setShowSMA] = useState(true);
  const [showEMA, setShowEMA] = useState(false);
  const [showVWAP, setShowVWAP] = useState(false);
  const [showATR, setShowATR] = useState(false);
  const [showUncertainty, setShowUncertainty] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Simulated virtual trading console states
  const [portfolio, setPortfolio] = useState(null);
  const [tradeShares, setTradeShares] = useState('10');
  const [tradeStatus, setTradeStatus] = useState({ type: '', message: '' });
  const [isTrading, setIsTrading] = useState(false);

  const fetchPortfolio = async () => {
    try {
      const { data } = await API.get('/portfolio');
      setPortfolio(data);
    } catch (err) {
      console.error('Error fetching portfolio:', err);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, [selectedSymbol]);

  const handleSimulatedTrade = async (type) => {
    setTradeStatus({ type: '', message: '' });
    const qty = parseFloat(tradeShares);
    if (!qty || isNaN(qty) || qty <= 0) {
      setTradeStatus({ type: 'error', message: 'Enter a valid count of shares.' });
      return;
    }
    
    setIsTrading(true);
    try {
      const price = livePrice || predictionData?.currentPrice || 100;
      const endpoint = type === 'BUY' ? '/portfolio/buy' : '/portfolio/sell';
      await API.post(endpoint, {
        symbol: selectedSymbol,
        shares: qty,
        price: price
      });
      
      setTradeStatus({
        type: 'success',
        message: `Successfully executed: ${type} ${qty} shares of ${selectedSymbol} at $${price.toFixed(2)}!`
      });
      setTradeShares('10');
      fetchPortfolio();
      
      setTimeout(() => {
        setTradeStatus({ type: '', message: '' });
      }, 5000);
    } catch (err) {
      console.error('Simulated transaction failed:', err);
      setTradeStatus({
        type: 'error',
        message: err.response?.data?.message || 'Transaction failed.'
      });
    } finally {
      setIsTrading(false);
    }
  };

  const containerRef = useRef(null);
  const chartDivRef = useRef(null);
  const controlsDivRef = useRef(null);
  const valueSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const sbSeriesRef = useRef(null);

  // Synchronize internal symbol state with URL params
  useEffect(() => {
    setSelectedSymbol(symbol.toUpperCase());
  }, [symbol]);

  // Fetch prediction details for selected symbol
  const fetchPrediction = async (sym) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await API.get(`/stocks/predictions/${sym}`);
      setPredictionData(data);
      setLivePrice(data.currentPrice);
    } catch (err) {
      console.error('Error fetching prediction:', err);
      setError('Unable to fetch detailed model forecasting. Verify server status.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrediction(selectedSymbol);
  }, [selectedSymbol]);

  // Socket.io Real-Time Stock Tick Broadcaster
  useEffect(() => {
    const socket = io('http://localhost:5000');

    socket.on('stock-ticks', (ticks) => {
      const currentTick = ticks.find(t => t.symbol === selectedSymbol);
      if (currentTick) {
        setLivePrice(currentTick.price);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedSymbol]);

  // Dynamic Live Tick updates on amCharts 5 series
  useEffect(() => {
    if (!livePrice || !valueSeriesRef.current || !volumeSeriesRef.current || !sbSeriesRef.current) return;

    const vSeries = valueSeriesRef.current;
    const volSeries = volumeSeriesRef.current;
    const sSeries = sbSeriesRef.current;

    const data = vSeries.data.values;
    if (data && data.length > 0) {
      const lastIndex = data.length - 1;
      
      const lastItem = { ...data[lastIndex] };
      lastItem.Close = livePrice;
      if (livePrice > lastItem.High) lastItem.High = livePrice;
      if (livePrice < lastItem.Low) lastItem.Low = livePrice;
      vSeries.data.setIndex(lastIndex, lastItem);

      const volItem = { ...volSeries.data.values[lastIndex] };
      volItem.Close = livePrice;
      volSeries.data.setIndex(lastIndex, volItem);

      const sbItem = { ...sSeries.data.values[lastIndex] };
      sbItem.Close = livePrice;
      sSeries.data.setIndex(lastIndex, sbItem);
    }
  }, [livePrice]);

  // Handle Fullscreen browser API
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error(`Error enabling fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Sync fullscreen change with ESC key / native exit
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleCustomSearch = (e) => {
    e.preventDefault();
    if (customSymbol.trim()) {
      const sym = customSymbol.toUpperCase().trim();
      setSelectedSymbol(sym);
      navigate(`/chart/${sym}`);
      setCustomSymbol('');
    }
  };

  const handleTickerClick = (sym) => {
    setSelectedSymbol(sym);
    navigate(`/chart/${sym}`);
  };

  // Compile combined chart data (history + predictions + technicals)
  const compiledChartData = useMemo(() => {
    if (!predictionData) return [];
    
    const hist = predictionData.historicalPrices || [];
    const fut = predictionData.futurePrices || [];
    
    const histPoints = hist.map(item => ({
      date: item.date,
      price: item.price,
      predicted: null,
      upper: null,
      lower: null,
      sma: item.bbUpper && item.bbLower ? (item.bbUpper + item.bbLower) / 2 : null,
      ema12: item.ema12 || null,
      ema26: item.ema26 || null,
      vwap: item.vwap || null,
      atr: item.atr || null,
      type: 'Historical'
    }));

    if (histPoints.length === 0) return [];

    const lastHist = histPoints[histPoints.length - 1];
    
    const connectionPoint = {
      date: lastHist.date,
      price: lastHist.price,
      predicted: lastHist.price,
      upper: lastHist.price,
      lower: lastHist.price,
      sma: lastHist.sma,
      ema12: lastHist.ema12,
      ema26: lastHist.ema26,
      vwap: lastHist.vwap,
      atr: lastHist.atr,
      type: 'Connection'
    };

    const futPoints = fut.map(item => ({
      date: item.date,
      price: null,
      predicted: item.price,
      upper: item.upper,
      lower: item.lower,
      sma: null,
      ema12: item.ema12 || null,
      ema26: item.ema26 || null,
      vwap: null,
      atr: null,
      type: 'Forecast'
    }));

    return [...histPoints, connectionPoint, ...futPoints];
  }, [predictionData]);

  // Real-time calculation of change against starting history price in viewport
  const livePriceChange = useMemo(() => {
    if (!predictionData || !livePrice) return { val: 0, pct: 0 };
    const base = predictionData.currentPrice;
    const diff = livePrice - base;
    const pct = (diff / base) * 100;
    return { val: diff, pct };
  }, [predictionData, livePrice]);

  // amCharts 5 Stock & Volume Candlestick Chart Initialization
  useEffect(() => {
    if (activeChartTab !== 'candlestick' || !predictionData || isLoading || !chartDivRef.current || !controlsDivRef.current) return;

    // Clear previous toolbar content to prevent duplicates in React re-renders
    controlsDivRef.current.innerHTML = "";

    // Create root element
    let root = am5.Root.new(chartDivRef.current);

    // Remove visible scrollbar minor grids
    const myTheme = am5.Theme.new(root);
    myTheme.rule("Grid", ["scrollbar", "minor"]).setAll({
      visible: false
    });

    let themes = [am5themes_Animated.new(root), myTheme];
    if (theme === 'dark') {
      themes.push(am5themes_Dark.new(root));
    }
    root.setThemes(themes);

    // Create a stock chart
    let stockChart = root.container.children.push(am5stock.StockChart.new(root, {}));

    // Set global number format
    root.numberFormatter.set("numberFormat", "#,###.00");

    // Create a main stock panel (chart)
    let mainPanel = stockChart.panels.push(am5stock.StockPanel.new(root, {
      wheelY: "zoomX",
      height: am5.percent(70),
      panX: true,
      panY: true
    }));

    // Create value axis
    let valueAxis = mainPanel.yAxes.push(am5xy.ValueAxis.new(root, {
      renderer: am5xy.AxisRendererY.new(root, {
        pan: "zoom"
      }),
      tooltip: am5.Tooltip.new(root, {}),
      numberFormat: "#,###.00",
      extraTooltipPrecision: 2
    }));

    let dateAxis = mainPanel.xAxes.push(am5xy.GaplessDateAxis.new(root, {
      groupData: true,
      groupCount: 150,
      baseInterval: {
        timeUnit: "day",
        count: 1
      },
      renderer: am5xy.AxisRendererX.new(root, {
        minorGridEnabled: true
      }),
      tooltip: am5.Tooltip.new(root, {})
    }));

    // Add series
    let valueSeries = mainPanel.series.push(am5xy.CandlestickSeries.new(root, {
      turboMode: true,
      name: selectedSymbol,
      clustered: false,
      valueXField: "Date",
      valueYField: "Close",
      highValueYField: "High",
      lowValueYField: "Low",
      openValueYField: "Open",
      calculateAggregates: true,
      xAxis: dateAxis,
      yAxis: valueAxis,
      legendValueText: "open: [bold]{openValueY}[/] high: [bold]{highValueY}[/] low: [bold]{lowValueY}[/] close: [bold]{valueY}[/]",
      legendRangeValueText: ""
    }));

    // Set main value series
    stockChart.set("stockSeries", valueSeries);

    // Add a stock legend
    let valueLegend = mainPanel.plotContainer.children.push(am5stock.StockLegend.new(root, {
      stockChart: stockChart
    }));

    // Create a volume panel (chart)
    let volumePanel = stockChart.panels.push(am5stock.StockPanel.new(root, {
      wheelY: "zoomX",
      panX: true,
      panY: false,
      height: am5.percent(30),
      paddingTop: 6
    }));

    // hide close button as we don't want this panel to be closed
    volumePanel.panelControls.closeButton.set("forceHidden", true);

    let volumeDateAxis = volumePanel.xAxes.push(am5xy.GaplessDateAxis.new(root, {
      baseInterval: {
        timeUnit: "day",
        count: 1
      },
      groupData: true,
      groupCount: 150,
      renderer: am5xy.AxisRendererX.new(root, {
        minorGridEnabled: true
      }),
      tooltip: am5.Tooltip.new(root, {
        forceHidden: true
      }),
      height: 0
    }));

    // we don't need it to be visible
    volumeDateAxis.get("renderer").labels.template.set("forceHidden", true);

    // Create volume axis
    let volumeAxisRenderer = am5xy.AxisRendererY.new(root, {
      pan: "zoom"
    });

    let volumeValueAxis = volumePanel.yAxes.push(am5xy.ValueAxis.new(root, {
      numberFormat: "#.#a",
      renderer: volumeAxisRenderer
    }));

    // Add series
    let volumeSeries = volumePanel.series.push(am5xy.ColumnSeries.new(root, {
      turboMode: true,
      name: "Volume",
      clustered: false,
      valueXField: "Date",
      valueYField: "Volume",
      xAxis: volumeDateAxis,
      yAxis: volumeValueAxis,
      legendValueText: "[bold]{valueY.formatNumber('#,###.0a')}[/]"
    }));

    volumeSeries.columns.template.setAll({
      strokeOpacity: 0,
      fillOpacity: 0.5
    });

    // color columns by stock rules
    volumeSeries.columns.template.adapters.add("fill", function (fill, target) {
      let dataItem = target.dataItem;
      if (dataItem) {
        return stockChart.getVolumeColor(dataItem);
      }
      return fill;
    });

    // Add a stock legend
    let volumeLegend = volumePanel.plotContainer.children.push(am5stock.StockLegend.new(root, {
      stockChart: stockChart
    }));

    // Set main series
    stockChart.set("volumeSeries", volumeSeries);
    valueLegend.data.setAll([valueSeries]);
    volumeLegend.data.setAll([volumeSeries]);

    // Add cursor(s)
    mainPanel.set("cursor", am5xy.XYCursor.new(root, {
      yAxis: valueAxis,
      xAxis: dateAxis,
      snapToSeries: [valueSeries],
      snapToSeriesBy: "y!"
    }));

    let volumeCursor = volumePanel.set("cursor", am5xy.XYCursor.new(root, {
      yAxis: volumeValueAxis,
      xAxis: volumeDateAxis,
      snapToSeries: [volumeSeries],
      snapToSeriesBy: "y!"
    }));

    volumeCursor.lineY.set("forceHidden", true);

    // Add scrollbar
    let scrollbar = mainPanel.set("scrollbarX", am5xy.XYChartScrollbar.new(root, {
      orientation: "horizontal",
      height: 50
    }));
    stockChart.toolsContainer.children.push(scrollbar);

    let sbDateAxis = scrollbar.chart.xAxes.push(am5xy.GaplessDateAxis.new(root, {
      baseInterval: {
        timeUnit: "day",
        count: 1
      },
      renderer: am5xy.AxisRendererX.new(root, {
        minorGridEnabled: true
      })
    }));

    let sbValueAxis = scrollbar.chart.yAxes.push(am5xy.ValueAxis.new(root, {
      renderer: am5xy.AxisRendererY.new(root, {})
    }));

    let sbSeries = scrollbar.chart.series.push(am5xy.LineSeries.new(root, {
      valueYField: "Close",
      valueXField: "Date",
      xAxis: sbDateAxis,
      yAxis: sbValueAxis
    }));

    sbSeries.fills.template.setAll({
      visible: true,
      fillOpacity: 0.3
    });

    // Map historical prices into amCharts compatible format
    const rawHistory = predictionData.historicalPrices || [];
    const formattedData = rawHistory.map(item => ({
      Date: new Date(item.date).getTime(),
      Open: item.open,
      High: item.high,
      Low: item.low,
      Close: item.price,
      Volume: item.volume
    }));

    valueSeries.data.setAll(formattedData);
    volumeSeries.data.setAll(formattedData);
    sbSeries.data.setAll(formattedData);

    // Save refs for dynamic live tick updating
    valueSeriesRef.current = valueSeries;
    volumeSeriesRef.current = volumeSeries;
    sbSeriesRef.current = sbSeries;

    // Stock toolbar controls
    let toolbar = am5stock.StockToolbar.new(root, {
      container: controlsDivRef.current,
      stockChart: stockChart,
      controls: [
        am5stock.IndicatorControl.new(root, {
          stockChart: stockChart,
          legend: valueLegend
        }),
        am5stock.DateRangeSelector.new(root, {
          stockChart: stockChart
        }),
        am5stock.PeriodSelector.new(root, {
          stockChart: stockChart,
          periods: [
            { timeUnit: "day", count: 5, name: "5D" },
            { timeUnit: "month", count: 1, name: "1M" },
            { timeUnit: "month", count: 3, name: "3M" },
            { timeUnit: "month", count: 6, name: "6M" },
            { timeUnit: "year", count: 1, name: "1Y" },
            { timeUnit: "max", name: "Max" }
          ]
        }),
        am5stock.DrawingControl.new(root, {
          stockChart: stockChart
        }),
        am5stock.ResetControl.new(root, {
          stockChart: stockChart
        }),
        am5stock.SettingsControl.new(root, {
          stockChart: stockChart
        })
      ]
    });

    // Cleanup on unmount/theme change/symbol change
    return () => {
      root.dispose();
      valueSeriesRef.current = null;
      volumeSeriesRef.current = null;
      sbSeriesRef.current = null;
    };
  }, [activeChartTab, predictionData, theme, selectedSymbol, isLoading]);

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col h-screen w-screen font-sans select-none overflow-hidden relative transition-colors duration-300 ${
        theme === 'dark' ? 'bg-[#070A13] text-slate-100' : 'bg-slate-50 text-slate-800'
      }`}
    >
      
      {/* 1. TOP INTERACTIVE DASHBOARD BAR */}
      <header className={`h-20 border-b px-6 flex items-center justify-between z-10 shrink-0 transition-colors duration-300 ${
        theme === 'dark' 
          ? 'border-white/5 bg-[#0C0F1D]/80 backdrop-blur-md' 
          : 'border-slate-200 bg-white/90 backdrop-blur-md shadow-sm'
      }`}>
        <div className="flex items-center space-x-6">
          <button 
            onClick={() => navigate('/predictions')}
            className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 border active:scale-95 ${
              theme === 'dark'
                ? 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border-white/5'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-slate-200'
            }`}
            title="Return to Trading Terminal"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span className="text-xs font-bold hidden md:inline">Terminal</span>
          </button>

          {/* Core Ticker Details */}
          {predictionData && (
            <div className="flex items-baseline space-x-3.5">
              <div>
                <span className={`text-2xl font-black tracking-wide font-mono ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{selectedSymbol}</span>
                <span className={`text-[10px] font-bold ml-2 uppercase hidden sm:inline ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{predictionData.buySellSignal} Conviction</span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className={`text-2xl font-black font-mono animate-pulse ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}`}>
                  ${livePrice ? livePrice.toFixed(2) : predictionData.currentPrice.toFixed(2)}
                </span>
                <span className={`text-xs font-bold font-mono ${
                  livePriceChange.val >= 0 ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  {livePriceChange.val >= 0 ? '▲ +' : '▼ '}{livePriceChange.pct.toFixed(2)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Ticker switch, theme toggle & search bar */}
        <div className="flex items-center space-x-4">
          
          {/* Quick symbol selectors */}
          <div className={`hidden lg:flex items-center space-x-1.5 p-1 rounded-xl border transition-colors ${
            theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-100 border-slate-200'
          }`}>
            {QUICK_TICKERS.map(t => (
              <button
                key={t.symbol}
                onClick={() => handleTickerClick(t.symbol)}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  selectedSymbol === t.symbol
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20'
                    : theme === 'dark'
                      ? 'text-slate-400 hover:text-white hover:bg-white/5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                {t.symbol}
              </button>
            ))}
          </div>

          <form onSubmit={handleCustomSearch} className="relative flex items-center">
            <input
              type="text"
              placeholder="Search ticker..."
              value={customSymbol}
              onChange={(e) => setCustomSymbol(e.target.value)}
              className={`px-4 py-1.5 text-xs rounded-xl border focus:outline-none w-32 md:w-44 transition-all ${
                theme === 'dark'
                  ? 'border-white/10 bg-black/40 text-slate-100 placeholder-slate-500 focus:border-cyan-500/60'
                  : 'border-slate-300 bg-slate-100 text-slate-800 placeholder-slate-400 focus:border-cyan-600/60'
              }`}
            />
            <button type="submit" className={`absolute right-2 transition-colors ${theme === 'dark' ? 'text-slate-500 hover:text-cyan-400' : 'text-slate-400 hover:text-cyan-600'}`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          {/* Theme Toggle Button inside Fullscreen View */}
          <button
            onClick={toggleTheme}
            className={`p-2.5 rounded-xl border cursor-pointer transition-all active:scale-95 ${
              theme === 'dark'
                ? 'bg-white/5 hover:bg-white/10 border-white/5 text-amber-500'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-indigo-600'
            }`}
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === 'dark' ? (
              <svg className="w-4.5 h-4.5 text-amber-500 animate-[spin_40s_linear_infinite]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            ) : (
              <svg className="w-4.5 h-4.5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            )}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={handleToggleFullscreen}
            className={`p-2.5 rounded-xl border cursor-pointer transition-all active:scale-95 ${
              theme === 'dark'
                ? 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-400 hover:text-white'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title="Toggle True Fullscreen"
          >
            {isFullscreen ? (
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9H4.5m4.5 0V4.5m0 4.5L3 3M15 9h4.5m-4.5 0V4.5m0 4.5l6-6M9 15H4.5m4.5 0v4.5m0-4.5l-6 6M15 15h4.5m-4.5 0v4.5m0-4.5l6 6" />
              </svg>
            ) : (
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75h4.5m-4.5 0v4.5m0-4.5L9 9M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9M3.75 20.25h4.5m-4.5 0v-4.5m0 4.5L9 15M20.25 20.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* 2. MAIN FULLSCREEN SPLIT VIEW */}
      <div className="flex-1 flex flex-col lg:flex-row w-full overflow-hidden relative">
        
        {/* SIDEBAR FOR ADVANCED CONTROLS & GAUGES */}
        <aside className={`w-full lg:w-72 border-b lg:border-b-0 lg:border-r flex flex-col shrink-0 overflow-y-auto transition-colors duration-300 ${
          theme === 'dark' ? 'bg-[#0A0D18] border-white/5' : 'bg-slate-50 border-slate-200'
        }`}>
          
          {/* SEC 1: CHART CONTROLS */}
          <div className={`p-5 border-b space-y-4 ${theme === 'dark' ? 'border-white/5' : 'border-slate-200'}`}>
            <h3 className={`text-[10px] font-black uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Advanced Technical Overlays</h3>
            
            <div className="space-y-3.5 text-xs">
              
              {/* SMA-20 */}
              <label className={`flex items-center justify-between cursor-pointer p-2 rounded-lg transition-colors ${
                theme === 'dark' ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-200/50 text-slate-700'
              }`}>
                <span className="font-bold">SMA-20 Trendline</span>
                <input 
                  type="checkbox" 
                  checked={showSMA}
                  onChange={(e) => setShowSMA(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-white/10 text-cyan-500 focus:ring-0 cursor-pointer"
                />
              </label>

              {/* EMA */}
              <label className={`flex items-center justify-between cursor-pointer p-2 rounded-lg transition-colors ${
                theme === 'dark' ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-200/50 text-slate-700'
              }`}>
                <span className="font-bold">EMA-12 / 26 Crosses</span>
                <input 
                  type="checkbox" 
                  checked={showEMA}
                  onChange={(e) => setShowEMA(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-white/10 text-cyan-500 focus:ring-0 cursor-pointer"
                />
              </label>

              {/* Uncertainty Shading */}
              <label className={`flex items-center justify-between cursor-pointer p-2 rounded-lg transition-colors ${
                theme === 'dark' ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-200/50 text-slate-700'
              }`}>
                <span className="font-bold">LSTM Uncertainty Cone</span>
                <input 
                  type="checkbox" 
                  checked={showUncertainty}
                  onChange={(e) => setShowUncertainty(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-white/10 text-cyan-500 focus:ring-0 cursor-pointer"
                />
              </label>

              {/* VWAP */}
              <label className={`flex items-center justify-between cursor-pointer p-2 rounded-lg transition-colors ${
                theme === 'dark' ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-200/50 text-slate-700'
              }`}>
                <span className="font-bold">VWAP Overlay</span>
                <input 
                  type="checkbox" 
                  checked={showVWAP}
                  onChange={(e) => setShowVWAP(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-white/10 text-cyan-500 focus:ring-0 cursor-pointer"
                />
              </label>

              {/* ATR */}
              <label className={`flex items-center justify-between cursor-pointer p-2 rounded-lg transition-colors ${
                theme === 'dark' ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-200/50 text-slate-700'
              }`}>
                <span className="font-bold">ATR-14 Variance</span>
                <input 
                  type="checkbox" 
                  checked={showATR}
                  onChange={(e) => setShowATR(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-white/10 text-cyan-500 focus:ring-0 cursor-pointer"
                />
              </label>

            </div>
          </div>

          {predictionData && (
            <div className="p-5 flex-1 space-y-6">
              
              {/* SEC 2: SIMULATED TRADE EXECUTION TERMINAL */}
              <div className={`p-4 rounded-xl border space-y-4 shadow-sm relative overflow-hidden ${
                theme === 'dark' ? 'bg-white/5 border-white/5 font-mono' : 'bg-white border-slate-200 font-mono'
              }`}>
                <div className="absolute top-0 right-0 w-16 h-16 bg-cyberBlue/10 rounded-full filter blur-lg -mr-6 -mt-6"></div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-wider block text-cyberBlue dark:text-cyberTeal font-sans">Simulated Trading</span>
                  <h4 className="text-xs font-black font-sans uppercase">Terminal execution</h4>
                </div>

                {tradeStatus.message && (
                  <div className={`p-2.5 rounded-lg text-[9px] font-black border tracking-wide font-mono ${
                    tradeStatus.type === 'success'
                      ? 'bg-accentGreen/15 border-accentGreen/25 text-accentGreen'
                      : 'bg-accentRed/15 border-accentRed/25 text-accentRed'
                  }`}>
                    {tradeStatus.message}
                  </div>
                )}

                <div className="space-y-3.5 text-xs font-semibold">
                  <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                    <span>Buying Power:</span>
                    <span className="text-slate-800 dark:text-slate-250 font-black">${portfolio?.summary?.buyingPower?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '100,000.00'}</span>
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                    <span>Position Owned:</span>
                    <span className="text-slate-800 dark:text-slate-250 font-black">
                      {portfolio?.holdings?.find(h => h.symbol === selectedSymbol)?.shares || 0} Shares
                    </span>
                  </div>

                  <div className="space-y-1.5 font-sans">
                    <label className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider block">Order Quantity (Shares)</label>
                    <input
                      type="text"
                      value={tradeShares}
                      onChange={(e) => setTradeShares(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-cyberBlue text-slate-900 dark:text-slate-100 transition-all font-mono font-bold ${
                        theme === 'dark' ? 'border-white/10 bg-black/45' : 'border-slate-300 bg-slate-100/50'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleSimulatedTrade('BUY')}
                      disabled={isTrading}
                      className="py-2.5 bg-gradient-to-r from-accentGreen to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 text-slate-950 font-black rounded-xl text-[10px] tracking-widest shadow-lg shadow-accentGreen/15 transition-all active:scale-95 cursor-pointer uppercase text-center font-sans border-0"
                    >
                      BUY
                    </button>
                    <button
                      onClick={() => handleSimulatedTrade('SELL')}
                      disabled={isTrading}
                      className="py-2.5 bg-gradient-to-r from-accentRed to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white font-black rounded-xl text-[10px] tracking-widest shadow-lg shadow-accentRed/15 transition-all active:scale-95 cursor-pointer uppercase text-center font-sans border-0"
                    >
                      SELL
                    </button>
                  </div>
                </div>
              </div>

              {/* SEC 3: CONVICTION BOX */}
              <div className={`p-4 rounded-xl border space-y-3 shadow-sm ${
                theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'
              }`}>
                <span className={`text-[10px] font-black uppercase tracking-wider block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>LSTM Forecast Delta</span>
                <div className="flex justify-between items-baseline">
                  <span className={`text-2xl font-black font-mono tracking-wide ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}`}>
                    ${predictionData.predictedPrice.toFixed(2)}
                  </span>
                  <span className={`text-xs font-extrabold ${predictionData.trend === 'UP' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {predictionData.trend === 'UP' ? '▲ Bullish' : '▼ Bearish'}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/5 rounded-full h-1 overflow-hidden">
                  <div 
                    className={`h-full ${predictionData.trend === 'UP' ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                    style={{ width: `${Math.min(100, Math.abs(predictionData.changePercent) * 20)}%` }}
                  />
                </div>
                <span className={`text-[9px] font-semibold block leading-normal ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                  Target expected close shifts by {predictionData.changePercent.toFixed(2)}% in 24 hours.
                </span>
              </div>

              {/* SEC 3: INDICATOR STATISTICS */}
              <div className="space-y-4">
                <h3 className={`text-[10px] font-black uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Momentum Metrics</h3>
                
                {/* RSI Gauge */}
                <div className="space-y-2 p-1">
                  <div className={`flex justify-between text-[10px] font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    <span>RSI-14</span>
                    <span className="font-mono">{predictionData.indicators.rsi}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        predictionData.indicators.rsi < 35 
                          ? 'bg-emerald-500' 
                          : predictionData.indicators.rsi > 65 
                          ? 'bg-rose-500' 
                          : theme === 'dark' ? 'bg-cyan-500' : 'bg-cyan-600'
                      }`}
                      style={{ width: `${predictionData.indicators.rsi}%` }}
                    />
                  </div>
                  <span className={`text-[9px] font-semibold block leading-normal ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                    {predictionData.indicators.rsi < 35 ? 'Extremely Oversold (Rebound Liked)' : predictionData.indicators.rsi > 65 ? 'Overbought (Variance expected)' : 'Stable / Consolidation'}
                  </span>
                </div>

                {/* MACD Gauge */}
                <div className="space-y-1 p-1">
                  <div className={`flex justify-between text-[10px] font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    <span>MACD Divergence</span>
                    <span className={`font-mono ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}`}>
                      {(predictionData.indicators.macd - predictionData.indicators.macdSignal).toFixed(3)}
                    </span>
                  </div>
                  <div className={`flex justify-between text-[9px] font-semibold pt-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                    <span>Signal Line:</span>
                    <span className="font-mono">{predictionData.indicators.macdSignal.toFixed(3)}</span>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* SEC 4: NOTICE IF FALLBACK */}
          {predictionData?.isFallback && (
            <div className="p-4 m-5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] font-semibold flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1 animate-pulse flex-shrink-0" />
              <span>NumPy Mathematical LSTM Model Active. (TensorFlow Emulator)</span>
            </div>
          )}

        </aside>

        {/* 3. CHART WORKSPACE */}
        <main className={`flex-grow h-full p-6 relative flex flex-col overflow-hidden transition-colors duration-300 ${
          theme === 'dark' ? 'bg-[#070911]' : 'bg-white'
        }`}>
          
          {isLoading ? (
            <div className="flex-grow flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-4 border-slate-200 dark:border-white/5 border-t-cyan-500 rounded-full animate-spin"></div>
              <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest animate-pulse">Compiling forecasting wand...</p>
            </div>
          ) : error ? (
            <div className="flex-grow flex flex-col items-center justify-center space-y-3 p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-rose-500">{error}</p>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col">
              
              {/* Premium Dual Chart Switcher Tabs */}
              <div className={`flex items-center space-x-2 border p-1 rounded-xl mb-4 self-start shrink-0 transition-colors ${
                theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-100 border-slate-200 shadow-sm'
              }`}>
                <button
                  onClick={() => setActiveChartTab('forecast')}
                  className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    activeChartTab === 'forecast'
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20'
                      : theme === 'dark'
                        ? 'text-slate-400 hover:text-white hover:bg-white/5'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`}
                >
                  AI Forecast
                </button>
                <button
                  onClick={() => setActiveChartTab('candlestick')}
                  className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    activeChartTab === 'candlestick'
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20'
                      : theme === 'dark'
                        ? 'text-slate-400 hover:text-white hover:bg-white/5'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`}
                >
                  Technical Candlestick
                </button>
              </div>

              {/* TAB 1: AI FORECAST AREA CHART */}
              {activeChartTab === 'forecast' && (
                <div className="flex-grow w-full flex flex-col min-h-0">
                  <div className="flex-grow w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={compiledChartData}
                        margin={{ top: 20, right: 10, left: -10, bottom: 10 }}
                      >
                        <defs>
                          <linearGradient id="fullscreenGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={theme === 'dark' ? '#06b6d4' : '#0891b2'} stopOpacity={0.18}/>
                            <stop offset="95%" stopColor={theme === 'dark' ? '#06b6d4' : '#0891b2'} stopOpacity={0.01}/>
                          </linearGradient>
                        </defs>
                        
                        <CartesianGrid 
                          strokeDasharray="4 4" 
                          stroke={theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.05)'} 
                          vertical={false}
                        />
                        
                        <XAxis 
                          dataKey="date" 
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 9, fontWeight: 700, fill: theme === 'dark' ? '#475569' : '#64748B' }}
                          dy={10}
                        />
                        
                        <YAxis 
                          domain={['auto', 'auto']}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 9, fontWeight: 700, fill: theme === 'dark' ? '#475569' : '#64748B' }}
                        />
                        
                        <Tooltip 
                          contentStyle={{ 
                            background: theme === 'dark' ? 'rgba(7, 10, 20, 0.95)' : 'rgba(255, 255, 255, 0.98)', 
                            borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                            borderRadius: '12px',
                            boxShadow: '0 15px 35px -5px rgba(0, 0, 0, 0.3)',
                            fontSize: '11px',
                            color: theme === 'dark' ? '#F8FAFC' : '#0F172A'
                          }}
                          labelStyle={{ fontWeight: 900, color: theme === 'dark' ? '#22d3ee' : '#0891b2', marginBottom: '6px' }}
                          formatter={(value, name) => {
                            if (name === 'price') return [`$${Number(value).toFixed(2)}`, 'Historical Base'];
                            if (name === 'predicted') return [`$${Number(value).toFixed(2)}`, 'AI Target'];
                            if (name === 'upper') return [`$${Number(value).toFixed(2)}`, 'Confidence Limit (High)'];
                            if (name === 'lower') return [`$${Number(value).toFixed(2)}`, 'Confidence Limit (Low)'];
                            if (name === 'sma') return [`$${Number(value).toFixed(2)}`, 'SMA-20'];
                            if (name === 'ema12') return [`$${Number(value).toFixed(2)}`, 'EMA-12'];
                            if (name === 'ema26') return [`$${Number(value).toFixed(2)}`, 'EMA-26'];
                            if (name === 'vwap') return [`$${Number(value).toFixed(2)}`, 'VWAP'];
                            if (name === 'atr') return [`$${Number(value).toFixed(2)}`, 'ATR-14'];
                            return [value, name];
                          }}
                        />

                        {/* Uncertainty Area Cone */}
                        {showUncertainty && (
                          <Area
                            name="uncertainty"
                            type="monotone"
                            dataKey={['lower', 'upper']}
                            stroke="none"
                            fill="url(#fullscreenGlow)"
                            connectNulls
                          />
                        )}

                        {/* Historical Price line */}
                        <Line
                          name="price"
                          type="monotone"
                          dataKey="price"
                          stroke="#0284c7"
                          strokeWidth={3}
                          dot={false}
                          activeDot={{ r: 6, strokeWidth: 2, stroke: theme === 'dark' ? '#070A13' : '#FFFFFF', fill: '#0284c7' }}
                        />

                        {/* Forecast Target line */}
                        <Line
                          name="predicted"
                          type="monotone"
                          dataKey="predicted"
                          stroke="#10b981"
                          strokeWidth={3}
                          strokeDasharray="5 5"
                          dot={false}
                          activeDot={{ r: 6, strokeWidth: 2, stroke: theme === 'dark' ? '#070A13' : '#FFFFFF', fill: '#10b981' }}
                        />

                        {/* Optional SMA-20 Line */}
                        {showSMA && (
                          <Line
                            name="sma"
                            type="monotone"
                            dataKey="sma"
                            stroke="#f59e0b"
                            strokeWidth={1.5}
                            dot={false}
                            strokeDasharray="2 2"
                            connectNulls
                          />
                        )}

                        {/* Optional EMA-12 Line */}
                        {showEMA && (
                          <Line
                            name="ema12"
                            type="monotone"
                            dataKey="ema12"
                            stroke="#a855f7"
                            strokeWidth={1.5}
                            dot={false}
                            connectNulls
                          />
                        )}

                        {/* Optional EMA-26 Line */}
                        {showEMA && (
                          <Line
                            name="ema26"
                            type="monotone"
                            dataKey="ema26"
                            stroke="#ec4899"
                            strokeWidth={1.5}
                            dot={false}
                            connectNulls
                          />
                        )}

                        {/* Optional VWAP Line */}
                        {showVWAP && (
                          <Line
                            name="vwap"
                            type="monotone"
                            dataKey="vwap"
                            stroke="#06b6d4"
                            strokeWidth={1.5}
                            dot={false}
                            connectNulls
                          />
                        )}

                        {/* Optional ATR Line */}
                        {showATR && (
                          <Line
                            name="atr"
                            type="monotone"
                            dataKey="atr"
                            stroke="#f43f5e"
                            strokeWidth={1.5}
                            dot={false}
                            connectNulls
                          />
                        )}
                        
                        {/* Tomorrow's predict line explicitly */}
                        <ReferenceLine 
                          x={predictionData.futurePrices[0]?.date} 
                          stroke="rgba(16, 185, 129, 0.4)" 
                          strokeDasharray="4 4"
                          label={{ 
                            value: '24h Target Shift', 
                            position: 'top', 
                            fill: '#10b981', 
                            fontSize: 8, 
                            fontWeight: 900 
                          }} 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Legend control box */}
                  <div className={`h-10 mt-2 shrink-0 flex items-center justify-center gap-6 text-[10px] font-black uppercase tracking-widest border-t pt-4 ${
                    theme === 'dark' ? 'text-slate-500 border-white/5' : 'text-slate-400 border-slate-100'
                  }`}>
                    <div className="flex items-center space-x-2 text-sky-400 dark:text-sky-500">
                      <span className="w-3.5 h-0.5 bg-sky-500 rounded" />
                      <span>Actual Close</span>
                    </div>
                    <div className="flex items-center space-x-2 text-emerald-400 dark:text-emerald-500">
                      <span className="w-3.5 h-0.5 border-t-2 border-dashed border-emerald-500" />
                      <span>LSTM Forecast</span>
                    </div>
                    {showSMA && (
                      <div className="flex items-center space-x-2 text-amber-500">
                        <span className="w-3.5 h-0.5 border-t-2 border-dotted border-amber-500" />
                        <span>SMA-20</span>
                      </div>
                    )}
                    {showEMA && (
                      <div className="flex items-center space-x-2 text-purple-400">
                        <span className="w-3.5 h-0.5 bg-purple-500 rounded" />
                        <span>EMA-12</span>
                      </div>
                    )}
                    {showEMA && (
                      <div className="flex items-center space-x-2 text-pink-400">
                        <span className="w-3.5 h-0.5 bg-pink-500 rounded" />
                        <span>EMA-26</span>
                      </div>
                    )}
                    {showVWAP && (
                      <div className="flex items-center space-x-2 text-cyan-400">
                        <span className="w-3.5 h-0.5 bg-cyan-500 rounded" />
                        <span>VWAP</span>
                      </div>
                    )}
                    {showATR && (
                      <div className="flex items-center space-x-2 text-rose-400">
                        <span className="w-3.5 h-0.5 bg-rose-500 rounded" />
                        <span>ATR-14</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: AMCHARTS 5 STOCK CANDLESTICK & VOLUME SPLIT PANEL CHART */}
              {activeChartTab === 'candlestick' && (
                <div className="flex-grow w-full flex flex-col min-h-0 relative">
                  
                  {/* amCharts Stock Toolbar Wrapper */}
                  <div 
                    ref={controlsDivRef} 
                    className={`w-full mb-3 shrink-0 p-2 rounded-xl border text-xs ${
                      theme === 'dark' 
                        ? 'bg-black/35 border-white/5 text-slate-100' 
                        : 'bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                  ></div>

                  {/* amCharts Chart View Container */}
                  <div 
                    ref={chartDivRef} 
                    className="w-full flex-grow relative"
                    style={{ height: 'calc(100% - 48px)', minHeight: '350px' }}
                  ></div>

                </div>
              )}

            </div>
          )}

        </main>

      </div>

    </div>
  );
};

export default FullscreenChart;
