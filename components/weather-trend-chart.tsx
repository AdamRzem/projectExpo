import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { WeatherTrendPoint } from '@/lib/weather-data-template';

type ChartPoint = {
  x: number;
  y: number;
};

type WeatherTrendChartProps = {
  points: WeatherTrendPoint[];
  focusedIndex: number;
  lineColor?: string;
  areaTopColor?: string;
  areaBottomColor?: string;
  gridColor?: string;
  showFocus?: boolean;
};

const VIEWBOX_WIDTH = 1000;
const VIEWBOX_HEIGHT = 300;
const PADDING_X = 32;
const PADDING_Y = 24;

function toChartPoints(points: WeatherTrendPoint[]): ChartPoint[] {
  if (!points.length) {
    return [];
  }

  const values = points.map((point) => point.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;
  const drawableWidth = VIEWBOX_WIDTH - PADDING_X * 2;
  const drawableHeight = VIEWBOX_HEIGHT - PADDING_Y * 2;

  return points.map((point, index) => {
    const normalizedX = points.length === 1 ? 0.5 : index / (points.length - 1);
    const normalizedY = (point.value - minValue) / valueRange;

    return {
      x: PADDING_X + normalizedX * drawableWidth,
      y: VIEWBOX_HEIGHT - PADDING_Y - normalizedY * drawableHeight,
    };
  });
}

function toLinePath(points: ChartPoint[]): string {
  if (!points.length) {
    return '';
  }

  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)},${point.y.toFixed(1)}`)
    .join(' ');
}

function toAreaPath(points: ChartPoint[]): string {
  if (!points.length) {
    return '';
  }

  const linePath = toLinePath(points);
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  return `${linePath} L${lastPoint.x.toFixed(1)},${VIEWBOX_HEIGHT} L${firstPoint.x.toFixed(1)},${VIEWBOX_HEIGHT} Z`;
}

export function WeatherTrendChart({
  points,
  focusedIndex,
  lineColor = '#005fa0',
  areaTopColor = '#9ecaff',
  areaBottomColor = '#9ecaff',
  gridColor = '#eceef1',
  showFocus = true,
}: WeatherTrendChartProps) {
  const chartPoints = useMemo(() => toChartPoints(points), [points]);
  const linePath = useMemo(() => toLinePath(chartPoints), [chartPoints]);
  const areaPath = useMemo(() => toAreaPath(chartPoints), [chartPoints]);

  if (!chartPoints.length) {
    return <View style={styles.fallback} />;
  }

  const safeFocusedIndex = Math.max(0, Math.min(focusedIndex, chartPoints.length - 1));
  const focusedPoint = chartPoints[safeFocusedIndex];

  return (
    <View style={styles.container}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}>
        <Defs>
          <LinearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={areaTopColor} stopOpacity={0.3} />
            <Stop offset="100%" stopColor={areaBottomColor} stopOpacity={0.02} />
          </LinearGradient>
        </Defs>

        <Line x1={0} y1={50} x2={VIEWBOX_WIDTH} y2={50} stroke={gridColor} strokeWidth={1} />
        <Line x1={0} y1={150} x2={VIEWBOX_WIDTH} y2={150} stroke={gridColor} strokeWidth={1} />
        <Line x1={0} y1={250} x2={VIEWBOX_WIDTH} y2={250} stroke={gridColor} strokeWidth={1} />

        <Path d={areaPath} fill="url(#trendGradient)" />
        <Path d={linePath} fill="none" stroke={lineColor} strokeWidth={4} strokeLinecap="round" />

        {showFocus ? (
          <>
            <Line
              x1={focusedPoint.x}
              y1={0}
              x2={focusedPoint.x}
              y2={VIEWBOX_HEIGHT}
              stroke="#c1c6d7"
              strokeWidth={1}
              strokeDasharray="7 7"
            />
            <Circle cx={focusedPoint.x} cy={focusedPoint.y} r={7} fill={lineColor} />
            <Circle cx={focusedPoint.x} cy={focusedPoint.y} r={11} fill={lineColor} fillOpacity={0.2} />
          </>
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 256,
    width: '100%',
  },
  fallback: {
    height: 256,
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#f2f4f7',
  },
});
