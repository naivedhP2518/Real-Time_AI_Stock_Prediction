import React, { useLayoutEffect, useRef, useMemo } from 'react';

// ─── amCharts 5 imports ───────────────────────────────────────────────────────
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import * as am5stock from '@amcharts/amcharts5/stock';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';

/**
 * AmStockChart
 * 
 * Props:
 *   chartData  – array of { time, open, high, low, close, price, volume, ma, isUp }
 *   selectedStock – { symbol, price, change, ... }
 *   height    – CSS string, default '100%'
 */
const AmStockChart = ({ chartData = [], selectedStock, height = '100%' }) => {
  const chartDivRef = useRef(null);
  const controlsDivRef = useRef(null);
  const rootRef = useRef(null);

  // Map Dashboard chartData → amCharts format once
  const amData = useMemo(() => {
    const now = Date.now();
    return chartData.map((d, i) => ({
      Date: now - (chartData.length - 1 - i) * 86_400_000,
      Open:   +d.open.toFixed(2),
      High:   +d.high.toFixed(2),
      Low:    +d.low.toFixed(2),
      Close:  +d.close.toFixed(2),
      Volume: d.volume ?? 0
    }));
  }, [chartData]);

  const symbol = selectedStock?.symbol || 'STOCK';

  // ── Build / rebuild chart whenever amData or symbol changes ─────────────────
  useLayoutEffect(() => {
    if (!chartDivRef.current || !controlsDivRef.current) return;

    // Dispose any previous root
    if (rootRef.current) {
      rootRef.current.dispose();
      rootRef.current = null;
    }

    // ── Root ──────────────────────────────────────────────────────────────────
    const root = am5.Root.new(chartDivRef.current);
    rootRef.current = root;

    // Custom theme: hide scrollbar minor grid lines
    const myTheme = am5.Theme.new(root);
    myTheme.rule('Grid', ['scrollbar', 'minor']).setAll({ visible: false });

    root.setThemes([am5themes_Animated.new(root), myTheme]);
    root.numberFormatter.set('numberFormat', '#,###.00');

    // ── Stock chart ───────────────────────────────────────────────────────────
    const stockChart = root.container.children.push(
      am5stock.StockChart.new(root, {})
    );

    // ── Main panel ────────────────────────────────────────────────────────────
    const mainPanel = stockChart.panels.push(
      am5stock.StockPanel.new(root, {
        wheelY: 'zoomX',
        panX: true,
        panY: true
      })
    );

    // ── Value axis ────────────────────────────────────────────────────────────
    const valueAxis = mainPanel.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, { pan: 'zoom' }),
        extraMin: 0.1,
        tooltip: am5.Tooltip.new(root, {}),
        numberFormat: '#,###.00',
        extraTooltipPrecision: 2
      })
    );

    const dateAxis = mainPanel.xAxes.push(
      am5xy.GaplessDateAxis.new(root, {
        baseInterval: { timeUnit: 'day', count: 1 },
        renderer: am5xy.AxisRendererX.new(root, { minorGridEnabled: true }),
        tooltip: am5.Tooltip.new(root, {})
      })
    );

    // ── Candlestick series ────────────────────────────────────────────────────
    const valueSeries = mainPanel.series.push(
      am5xy.CandlestickSeries.new(root, {
        turboMode: true,
        name: symbol,
        clustered: false,
        valueXField: 'Date',
        valueYField: 'Close',
        highValueYField: 'High',
        lowValueYField: 'Low',
        openValueYField: 'Open',
        calculateAggregates: true,
        xAxis: dateAxis,
        yAxis: valueAxis,
        legendValueText:
          'open: [bold]{openValueY}[/] high: [bold]{highValueY}[/] low: [bold]{lowValueY}[/] close: [bold]{valueY}[/]',
        legendRangeValueText: ''
      })
    );

    stockChart.set('stockSeries', valueSeries);

    // ── Legend ────────────────────────────────────────────────────────────────
    const valueLegend = mainPanel.plotContainer.children.push(
      am5stock.StockLegend.new(root, { stockChart })
    );

    // ── Volume axis ───────────────────────────────────────────────────────────
    const volumeAxisRenderer = am5xy.AxisRendererY.new(root, {});
    volumeAxisRenderer.labels.template.set('forceHidden', true);
    volumeAxisRenderer.grid.template.set('forceHidden', true);

    const volumeValueAxis = mainPanel.yAxes.push(
      am5xy.ValueAxis.new(root, {
        numberFormat: '#.#a',
        height: am5.percent(20),
        y: am5.percent(100),
        centerY: am5.percent(100),
        renderer: volumeAxisRenderer
      })
    );

    const volumeSeries = mainPanel.series.push(
      am5xy.ColumnSeries.new(root, {
        turboMode: true,
        name: 'Volume',
        clustered: false,
        valueXField: 'Date',
        valueYField: 'Volume',
        xAxis: dateAxis,
        yAxis: volumeValueAxis,
        legendValueText: "[bold]{valueY.formatNumber('#,###.0a')}[/]"
      })
    );

    volumeSeries.columns.template.setAll({ strokeOpacity: 0, fillOpacity: 0.5 });
    volumeSeries.columns.template.adapters.add('fill', (fill, target) => {
      const dataItem = target.dataItem;
      if (dataItem) return stockChart.getVolumeColor(dataItem);
      return fill;
    });

    stockChart.set('volumeSeries', volumeSeries);
    valueLegend.data.setAll([valueSeries, volumeSeries]);

    // ── Cursor ────────────────────────────────────────────────────────────────
    mainPanel.set(
      'cursor',
      am5xy.XYCursor.new(root, {
        yAxis: valueAxis,
        xAxis: dateAxis,
        snapToSeries: [valueSeries],
        snapToSeriesBy: 'y!'
      })
    );

    // ── Scrollbar ─────────────────────────────────────────────────────────────
    const scrollbar = mainPanel.set(
      'scrollbarX',
      am5xy.XYChartScrollbar.new(root, { orientation: 'horizontal', height: 50 })
    );
    stockChart.toolsContainer.children.push(scrollbar);

    const sbDateAxis = scrollbar.chart.xAxes.push(
      am5xy.GaplessDateAxis.new(root, {
        baseInterval: { timeUnit: 'day', count: 1 },
        renderer: am5xy.AxisRendererX.new(root, { minorGridEnabled: true })
      })
    );

    const sbValueAxis = scrollbar.chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {})
      })
    );

    const sbSeries = scrollbar.chart.series.push(
      am5xy.LineSeries.new(root, {
        valueYField: 'Close',
        valueXField: 'Date',
        xAxis: sbDateAxis,
        yAxis: sbValueAxis
      })
    );
    sbSeries.fills.template.setAll({ visible: true, fillOpacity: 0.3 });

    // ── Series-type switcher helpers ──────────────────────────────────────────
    function getNewSettings(series) {
      const keys = [
        'name', 'valueYField', 'highValueYField', 'lowValueYField',
        'openValueYField', 'calculateAggregates', 'valueXField',
        'xAxis', 'yAxis', 'legendValueText', 'legendRangeValueText',
        'stroke', 'fill'
      ];
      const newSettings = {};
      keys.forEach(k => { newSettings[k] = series.get(k); });
      return newSettings;
    }

    function setSeriesType(seriesType) {
      const currentSeries = stockChart.get('stockSeries');
      const newSettings = getNewSettings(currentSeries);
      const data = currentSeries.data.values;
      mainPanel.series.removeValue(currentSeries);

      let series;
      switch (seriesType) {
        case 'line':
          series = mainPanel.series.push(am5xy.LineSeries.new(root, newSettings));
          break;
        case 'candlestick':
        case 'procandlestick':
          newSettings.clustered = false;
          series = mainPanel.series.push(am5xy.CandlestickSeries.new(root, newSettings));
          if (seriesType === 'procandlestick') {
            series.columns.template.get('themeTags').push('pro');
          }
          break;
        case 'ohlc':
          newSettings.clustered = false;
          series = mainPanel.series.push(am5xy.OHLCSeries.new(root, newSettings));
          break;
        default:
          break;
      }

      if (series) {
        valueLegend.data.removeValue(currentSeries);
        series.data.setAll(data);
        stockChart.set('stockSeries', series);
        const cursor = mainPanel.get('cursor');
        if (cursor) cursor.set('snapToSeries', [series]);
        valueLegend.data.insertIndex(0, series);
      }
    }

    // ── Series-type control ───────────────────────────────────────────────────
    const seriesSwitcher = am5stock.SeriesTypeControl.new(root, { stockChart });
    seriesSwitcher.events.on('selected', ev => setSeriesType(ev.item.id));

    // ── Interval switcher ─────────────────────────────────────────────────────
    let currentGranularity = 'day';
    const intervalSwitcher = am5stock.IntervalControl.new(root, {
      stockChart,
      items: [
        { id: '1 minute', label: '1m',    interval: { timeUnit: 'minute', count: 1 } },
        { id: '1 day',    label: '1D',    interval: { timeUnit: 'day',    count: 1 } },
        { id: '1 week',   label: '1W',    interval: { timeUnit: 'week',   count: 1 } },
        { id: '1 month',  label: '1M',    interval: { timeUnit: 'month',  count: 1 } }
      ]
    });

    intervalSwitcher.events.on('selected', ev => {
      currentGranularity = ev.item.interval.timeUnit;
      const vSeries = stockChart.get('stockSeries');
      vSeries.events.once('datavalidated', () => mainPanel.zoomOut());
      dateAxis.set('baseInterval', ev.item.interval);
      sbDateAxis.set('baseInterval', ev.item.interval);
      stockChart.indicators.each(indicator => {
        if (indicator instanceof am5stock.ChartIndicator) {
          indicator.xAxis.set('baseInterval', ev.item.interval);
        }
      });
    });

    // ── Toolbar ───────────────────────────────────────────────────────────────
    am5stock.StockToolbar.new(root, {
      container: controlsDivRef.current,
      stockChart,
      controls: [
        am5stock.IndicatorControl.new(root, { stockChart, legend: valueLegend }),
        am5stock.DateRangeSelector.new(root, { stockChart }),
        am5stock.PeriodSelector.new(root, { stockChart }),
        intervalSwitcher,
        seriesSwitcher,
        am5stock.DrawingControl.new(root, { stockChart }),
        am5stock.ResetControl.new(root, { stockChart }),
        am5stock.SettingsControl.new(root, { stockChart })
      ]
    });

    // ── Load data from props ──────────────────────────────────────────────────
    [valueSeries, volumeSeries, sbSeries].forEach(s => s.data.setAll(amData));

    // ── Cleanup on unmount / next rebuild ─────────────────────────────────────
    return () => {
      root.dispose();
      rootRef.current = null;
    };
  }, [amData, symbol]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height }}>
      {/* Toolbar container */}
      <div
        ref={controlsDivRef}
        id={`amstock-controls-${symbol}`}
        style={{
          width: '100%',
          minHeight: '40px',
          marginBottom: '4px'
        }}
      />
      {/* Chart canvas */}
      <div
        ref={chartDivRef}
        id={`amstock-chart-${symbol}`}
        style={{ flex: 1, width: '100%', minHeight: '220px' }}
      />
    </div>
  );
};

export default AmStockChart;
