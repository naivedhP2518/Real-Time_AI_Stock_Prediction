import React, { useLayoutEffect, useEffect, useRef, useMemo } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';

/**
 * AmCandleChart – blink-free amCharts 5 candlestick + median step-line.
 *
 * Strategy to eliminate blinking:
 *   • useLayoutEffect([])   → build the chart ONCE, never rebuild it.
 *   • useEffect([amData])   → only call series.data.setAll() when data changes.
 *   • useEffect([symbol])   → only update the series name label when stock changes.
 *
 * Props:
 *   chartData     – array of { open, high, low, close, ... } from Dashboard
 *   selectedStock – { symbol, ... }
 *   height        – CSS string, defaults to '100%'
 */
const AmCandleChart = ({ chartData = [], selectedStock, height = '100%' }) => {
  const chartDivRef    = useRef(null);
  const rootRef        = useRef(null);
  const seriesRef      = useRef(null);   // CandlestickSeries ref
  const medianaRef     = useRef(null);   // StepLineSeries ref

  const symbol = selectedStock?.symbol || 'STOCK';

  // ── Map Dashboard chartData → amCharts format (memoized) ──────────────────
  const amData = useMemo(() => {
    const now = Date.now();
    return chartData.map((d, i) => {
      const open  = +d.open.toFixed(2);
      const high  = +d.high.toFixed(2);
      const low   = +d.low.toFixed(2);
      const close = +d.close.toFixed(2);
      return {
        date:    now - (chartData.length - 1 - i) * 86_400_000,
        open,
        high,
        low,
        close,
        mediana: +(low + (high - low) / 2).toFixed(2)
      };
    });
  }, [chartData]);

  // ── BUILD CHART ONCE (empty dependency array → runs only on mount) ────────
  useLayoutEffect(() => {
    if (!chartDivRef.current) return;

    // ── Root ─────────────────────────────────────────────────────────────────
    const root = am5.Root.new(chartDivRef.current);
    rootRef.current = root;

    root.setThemes([am5themes_Animated.new(root)]);

    // ── XY Chart ──────────────────────────────────────────────────────────────
    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        focusable:   true,
        panX:        true,
        panY:        true,
        wheelX:      'panX',
        wheelY:      'zoomX',
        layout:      root.verticalLayout,
        paddingLeft: 0
      })
    );

    // ── Axes ──────────────────────────────────────────────────────────────────
    const xAxis = chart.xAxes.push(
      am5xy.DateAxis.new(root, {
        baseInterval: { timeUnit: 'day', count: 1 },
        renderer: am5xy.AxisRendererX.new(root, {
          pan:             'zoom',
          minorGridEnabled: true,
          minGridDistance:  70
        }),
        tooltip: am5.Tooltip.new(root, {})
      })
    );

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, { pan: 'zoom' })
      })
    );

    // ── Candlestick series ────────────────────────────────────────────────────
    const bgColor = root.interfaceColors.get('background');

    const series = chart.series.push(
      am5xy.CandlestickSeries.new(root, {
        fill:            bgColor,
        stroke:          bgColor,
        name:            symbol,
        xAxis:           xAxis,
        yAxis:           yAxis,
        valueYField:     'close',
        openValueYField: 'open',
        lowValueYField:  'low',
        highValueYField: 'high',
        valueXField:     'date',
        tooltip: am5.Tooltip.new(root, {
          pointerOrientation: 'horizontal',
          labelText: [
            '[bold]{name}[/]',
            'Open:   [bold]{openValueY}[/]',
            'High:   [bold]{highValueY}[/]',
            'Low:    [bold]{lowValueY}[/]',
            'Close:  [bold]{valueY}[/]',
            'Median: [bold]{mediana}[/]'
          ].join('\n')
        })
      })
    );

    // Green when close ≥ open, red when close < open
    series.columns.template.states.create('riseFromOpen', {
      fill:   am5.color(0x10b981),
      stroke: am5.color(0x10b981)
    });
    series.columns.template.states.create('dropFromOpen', {
      fill:   am5.color(0xef4444),
      stroke: am5.color(0xef4444)
    });

    seriesRef.current = series;

    // ── Median step-line overlay ──────────────────────────────────────────────
    const medianaSeries = chart.series.push(
      am5xy.StepLineSeries.new(root, {
        stroke:        am5.color(0x6366f1),
        strokeWidth:   2,
        strokeOpacity: 0.85,
        xAxis:         xAxis,
        yAxis:         yAxis,
        valueYField:   'mediana',
        valueXField:   'date',
        noRisers:      true,
        tooltip: am5.Tooltip.new(root, {
          labelText: 'Median: [bold]{valueY}[/]'
        })
      })
    );

    medianaRef.current = medianaSeries;

    // ── Cursor ────────────────────────────────────────────────────────────────
    const cursor = chart.set(
      'cursor',
      am5xy.XYCursor.new(root, { xAxis })
    );
    cursor.lineY.set('visible', false);

    // ── Scrollbar ─────────────────────────────────────────────────────────────
    chart.set(
      'scrollbarX',
      am5.Scrollbar.new(root, { orientation: 'horizontal' })
    );

    // ── Legend ────────────────────────────────────────────────────────────────
    const legend = chart.children.push(
      am5.Legend.new(root, {
        centerX:   am5.percent(50),
        x:         am5.percent(50),
        marginTop: 6
      })
    );
    legend.data.setAll(chart.series.values);

    // ── Initial data load ─────────────────────────────────────────────────────
    // (populated by the data-update useEffect below on first run too)
    series.appear(1000, 100);
    medianaSeries.appear(1000, 100);
    chart.appear(1000, 100);

    // ── Cleanup only on unmount ───────────────────────────────────────────────
    return () => {
      root.dispose();
      rootRef.current    = null;
      seriesRef.current  = null;
      medianaRef.current = null;
    };
  }, []); // ← empty deps: chart is created ONCE, never rebuilt

  // ── UPDATE DATA smoothly whenever amData changes (no chart recreation) ────
  useEffect(() => {
    if (!seriesRef.current || !medianaRef.current) return;
    if (amData.length === 0) return;

    // amCharts transitions existing data smoothly without a redraw flash
    seriesRef.current.data.setAll(amData);
    medianaRef.current.data.setAll(amData);
  }, [amData]);

  // ── UPDATE series name when selected stock changes (no rebuild) ───────────
  useEffect(() => {
    if (!seriesRef.current) return;
    seriesRef.current.set('name', symbol);
  }, [symbol]);

  return (
    <div
      ref={chartDivRef}
      style={{ width: '100%', height }}
    />
  );
};

export default AmCandleChart;
