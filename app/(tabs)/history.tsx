import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WeatherTrendChart } from '@/components/weather-trend-chart';
import {
  HistoryData,
  HistoryRecord,
  WeatherTrendPoint,
  fetchHistoryTemplate,
  subscribeToNewWeatherRows,
} from '@/lib/weather-data-template';

const COLORS = {
  background: '#f7f9fc',
  card: '#ffffff',
  cardAlt: '#f2f4f7',
  line: '#eceef1',
  primary: '#005fa0',
  primarySoft: '#9ecaff',
  textMain: '#191c1e',
  textMuted: '#5e5e5f',
  outline: '#c1c6d7',
};

function resolveRecordIcon(iconName: HistoryRecord['iconName']) {
  if (iconName === 'sunny') {
    return 'wb-sunny';
  }

  if (iconName === 'partly_cloudy') {
    return 'wb-cloudy';
  }

  return 'grain';
}

function buildHumidityTrend(points: WeatherTrendPoint[]): WeatherTrendPoint[] {
  return points.map((point, index) => ({
    ...point,
    value: 44 + index * 3,
  }));
}

export default function HistoryScreen() {
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [focusedPointIndex, setFocusedPointIndex] = useState(0);
  const [activeMetric, setActiveMetric] = useState<'temperature' | 'humidity'>('temperature');

  useEffect(() => {
    let isMounted = true;

    const loadData = async (showLoadingState: boolean) => {
      if (showLoadingState) {
        setLoading(true);
      }
      setError(null);

      try {
        const payload = await fetchHistoryTemplate();
        if (!isMounted) {
          return;
        }

        setData(payload);
        setActiveMetric(payload.activeMetric);

        const selectedChip = payload.dayChips.find((chip) => chip.state === 'selected');
        setSelectedDayId(selectedChip?.id ?? payload.dayChips[0]?.id ?? null);
        setFocusedPointIndex(Math.max(0, payload.temperatureTrendPoints.length - 2));
      } catch (caughtError) {
        if (!isMounted) {
          return;
        }

        const message = caughtError instanceof Error ? caughtError.message : 'Unknown error';
        setError(message);
      } finally {
        if (isMounted && showLoadingState) {
          setLoading(false);
        }
      }
    };

    void loadData(true);

    const unsubscribe = subscribeToNewWeatherRows(() => {
      void loadData(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const chartPoints = useMemo(() => {
    if (!data) {
      return [];
    }

    return activeMetric === 'temperature' ? data.temperatureTrendPoints : data.humidityTrendPoints;
  }, [activeMetric, data]);

  const focusedPoint = useMemo(() => {
    if (!chartPoints.length) {
      return null;
    }

    const safeIndex = Math.max(0, Math.min(focusedPointIndex, chartPoints.length - 1));
    return chartPoints[safeIndex];
  }, [chartPoints, focusedPointIndex]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerBrandWrap}>
          <MaterialIcons name="cloud" size={24} color={COLORS.primary} />
          <Text style={styles.headerTitle}>History</Text>
        </View>
        <Pressable accessibilityRole="button" hitSlop={10}>
          <MaterialIcons name="notifications" size={24} color={COLORS.textMuted} />
        </Pressable>
      </View>
      <View style={styles.headerDivider} />

      {loading ? (
        <View style={styles.stateWrap}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.stateText}>Loading history data...</Text>
        </View>
      ) : error ? (
        <View style={styles.stateWrap}>
          <MaterialIcons name="error-outline" size={18} color="#ba1a1a" />
          <Text style={styles.stateText}>Could not load history: {error}</Text>
        </View>
      ) : data ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionWrap}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Select Range</Text>
              <Text style={styles.monthLabel}>{data.monthLabel}</Text>
            </View>

            <View style={styles.dayChipShell}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayChipRow}>
                {data.dayChips.map((chip) => {
                  const isManualSelected = selectedDayId === chip.id;
                  const isPresetSelected = chip.state === 'selected';
                  const isSelected = isManualSelected || (!selectedDayId && isPresetSelected);

                  return (
                    <Pressable
                      key={chip.id}
                      onPress={() => setSelectedDayId(chip.id)}
                      style={[
                        styles.dayChip,
                        chip.state === 'inactive' ? styles.dayChipInactive : null,
                        chip.state === 'range' ? styles.dayChipRange : null,
                        isSelected ? styles.dayChipSelected : null,
                      ]}>
                      <Text style={[styles.dayChipWeekday, isSelected ? styles.dayChipSelectedText : null]}>
                        {chip.weekdayLabel}
                      </Text>
                      <Text style={[styles.dayChipDate, isSelected ? styles.dayChipSelectedText : null]}>
                        {chip.dayOfMonth}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          <View style={styles.chartSectionWrap}>
            <View style={styles.metricHeaderRow}>
              <View style={styles.metricTabWrap}>
                <Pressable
                  onPress={() => setActiveMetric('temperature')}
                  style={styles.metricTab}
                  accessibilityRole="button">
                  <View
                    style={[
                      styles.metricDot,
                      activeMetric === 'temperature' ? styles.metricDotActive : styles.metricDotMuted,
                    ]}
                  />
                  <Text
                    style={[
                      styles.metricTabText,
                      activeMetric === 'temperature' ? styles.metricTabTextActive : styles.metricTabTextMuted,
                    ]}>
                    Temp
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setActiveMetric('humidity')}
                  style={styles.metricTab}
                  accessibilityRole="button">
                  <View
                    style={[
                      styles.metricDot,
                      activeMetric === 'humidity' ? styles.metricDotActive : styles.metricDotMuted,
                    ]}
                  />
                  <Text
                    style={[
                      styles.metricTabText,
                      activeMetric === 'humidity' ? styles.metricTabTextActive : styles.metricTabTextMuted,
                    ]}>
                    Humidity
                  </Text>
                </Pressable>
              </View>
              <Text style={styles.trendTitle}>7-Day Trend</Text>
            </View>

            <View style={styles.chartCard}>
              <WeatherTrendChart points={chartPoints} focusedIndex={focusedPointIndex} />

              <View style={styles.timelineRow}>
                {chartPoints.map((point, pointIndex) => {
                  const isFocused = focusedPoint?.label === point.label;

                  return (
                    <Pressable
                      key={`${point.label}-${pointIndex}`}
                      onPress={() => setFocusedPointIndex(pointIndex)}
                      style={styles.timelineItem}
                      hitSlop={6}>
                      <Text style={[styles.timelineText, isFocused ? styles.timelineFocusedText : null]}>
                        {point.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {focusedPoint ? (
                <View style={styles.tooltipWrap}>
                  <View style={styles.tooltipTopRow}>
                    <Text style={styles.tooltipDate}>{focusedPoint.label}</Text>
                    <View style={styles.tooltipSeparator} />
                    <Text style={styles.tooltipValue}>
                      {focusedPoint.value} {activeMetric === 'temperature' ? 'C' : '%'}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.recordsSectionWrap}>
            <Text style={styles.sectionTitle}>Daily Records</Text>
            <View style={styles.recordListWrap}>
              {data.records.map((record) => (
                <View key={record.id} style={styles.recordItem}>
                  <View style={styles.recordLeadingWrap}>
                    <View style={styles.recordIconWrap}>
                      <MaterialIcons name={resolveRecordIcon(record.iconName)} size={22} color={COLORS.primary} />
                    </View>
                    <View>
                      <Text style={styles.recordDate}>{record.dateLabel}</Text>
                      <Text style={styles.recordSummary}>{record.summaryLabel}</Text>
                    </View>
                  </View>

                  <View style={styles.recordValuesWrap}>
                    <Text style={styles.recordTemp}>
                      {record.highTemp} / {record.lowTemp}
                    </Text>
                    <View style={styles.recordHumidityWrap}>
                      <MaterialIcons name="water-drop" size={14} color={COLORS.textMuted} />
                      <Text style={styles.recordHumidity}>{record.humidityPercent}%</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: 56,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBrandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerDivider: {
    height: 1,
    backgroundColor: COLORS.line,
  },
  stateWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  stateText: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 132,
    gap: 24,
  },
  sectionWrap: {
    gap: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 10,
  },
  sectionTitle: {
    color: COLORS.textMain,
    fontSize: 28,
    fontWeight: '800',
  },
  monthLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  dayChipShell: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  dayChipRow: {
    gap: 8,
    paddingHorizontal: 2,
  },
  dayChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
    minWidth: 64,
    gap: 2,
  },
  dayChipInactive: {
    backgroundColor: '#eef0f4',
    opacity: 0.64,
  },
  dayChipRange: {
    backgroundColor: COLORS.primarySoft,
  },
  dayChipSelected: {
    backgroundColor: COLORS.primary,
    transform: [{ scale: 1.08 }],
  },
  dayChipWeekday: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  dayChipDate: {
    color: COLORS.textMain,
    fontSize: 14,
    fontWeight: '700',
  },
  dayChipSelectedText: {
    color: '#ffffff',
  },
  chartSectionWrap: {
    gap: 10,
  },
  metricHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricTabWrap: {
    flexDirection: 'row',
    gap: 14,
  },
  metricTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  metricDotActive: {
    backgroundColor: COLORS.primary,
  },
  metricDotMuted: {
    backgroundColor: COLORS.textMuted,
    opacity: 0.45,
  },
  metricTabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  metricTabTextActive: {
    color: COLORS.primary,
  },
  metricTabTextMuted: {
    color: COLORS.textMuted,
    opacity: 0.55,
  },
  trendTitle: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: '800',
  },
  chartCard: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 18,
    position: 'relative',
  },
  timelineRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  timelineItem: {
    paddingVertical: 4,
  },
  timelineText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  timelineFocusedText: {
    color: COLORS.primary,
  },
  tooltipWrap: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dce1ea',
    paddingHorizontal: 10,
    paddingVertical: 8,
    shadowColor: '#191c1e',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tooltipTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tooltipDate: {
    color: COLORS.textMain,
    fontSize: 11,
    fontWeight: '700',
  },
  tooltipSeparator: {
    width: 3,
    height: 3,
    borderRadius: 999,
    backgroundColor: COLORS.outline,
  },
  tooltipValue: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  recordsSectionWrap: {
    gap: 12,
  },
  recordListWrap: {
    gap: 10,
  },
  recordItem: {
    backgroundColor: COLORS.cardAlt,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  recordLeadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  recordIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordDate: {
    color: COLORS.textMain,
    fontSize: 18,
    fontWeight: '700',
  },
  recordSummary: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  recordValuesWrap: {
    alignItems: 'flex-end',
    gap: 4,
  },
  recordTemp: {
    color: COLORS.primary,
    fontSize: 21,
    fontWeight: '800',
  },
  recordHumidityWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  recordHumidity: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
});
