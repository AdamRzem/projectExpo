import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WeatherTrendChart } from '@/components/weather-trend-chart';
import {
  CurrentWeatherData,
  fetchCurrentWeatherTemplate,
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

function HeroWeatherOrb() {
  return (
    <View style={styles.heroOrbWrap}>
      <View style={styles.heroOrbGlow} />
      <MaterialIcons name="wb-cloudy" size={116} color={COLORS.primary} />
    </View>
  );
}

export default function CurrentWeatherDashboardScreen() {
  const [data, setData] = useState<CurrentWeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [focusedPointIndex, setFocusedPointIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadData = async (showLoadingState: boolean) => {
      if (showLoadingState) {
        setLoading(true);
      }
      setError(null);

      try {
        const payload = await fetchCurrentWeatherTemplate();
        if (!isMounted) {
          return;
        }

        setData(payload);
        setFocusedPointIndex(Math.max(0, payload.trendPoints.length - 2));
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

  const selectedTrendPoint = useMemo(() => {
    if (!data?.trendPoints.length) {
      return null;
    }

    const safeIndex = Math.max(0, Math.min(focusedPointIndex, data.trendPoints.length - 1));
    return data.trendPoints[safeIndex];
  }, [data, focusedPointIndex]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerBrandWrap}>
          <MaterialIcons name="cloud" size={24} color={COLORS.primary} />
          <Text style={styles.headerTitle}>Atmospheric</Text>
        </View>
        <Pressable accessibilityRole="button" hitSlop={10}>
          <MaterialIcons name="notifications" size={24} color={COLORS.textMuted} />
        </Pressable>
      </View>
      <View style={styles.headerDivider} />

      {loading ? (
        <View style={styles.stateWrap}>
          <ActivityIndicator color={COLORS.primary} size="small" />
          <Text style={styles.stateText}>Loading dashboard data...</Text>
        </View>
      ) : error ? (
        <View style={styles.stateWrap}>
          <MaterialIcons name="error-outline" size={18} color="#ba1a1a" />
          <Text style={styles.stateText}>Could not load dashboard: {error}</Text>
        </View>
      ) : data ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.heroSection}>
            <View style={styles.heroTextWrap}>
              <Text style={styles.locationText}>{data.locationLabel}</Text>
              <View style={styles.tempWrap}>
                <Text style={styles.tempValue}>{data.temperatureValue}</Text>
                <Text style={styles.tempUnit}>{data.temperatureUnit}</Text>
              </View>
              <View style={styles.heroMetaWrap}>
                <View style={styles.metaItemWrap}>
                  <MaterialIcons name="water-drop" size={17} color={COLORS.textMuted} />
                  <Text style={styles.metaText}>{data.humidityPercent}% Humidity</Text>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaItemWrap}>
                  <MaterialIcons name="air" size={17} color={COLORS.textMuted} />
                  <Text style={styles.metaText}>
                    {data.windSpeedValue} {data.windSpeedUnit} {data.windDirection}
                  </Text>
                </View>
              </View>
            </View>
            <HeroWeatherOrb />
          </View>

          <View style={styles.cardLarge}>
            <View style={styles.cardLargeHeader}>
              <View>
                <Text style={styles.cardLargeTitle}>Temperature Trend</Text>
                <Text style={styles.cardLargeSubtitle}>Past 24 hours</Text>
              </View>
              <Text style={styles.deltaText}>{data.trendDeltaLabel}</Text>
            </View>

            <WeatherTrendChart points={data.trendPoints} focusedIndex={focusedPointIndex} />

            <View style={styles.timelineRow}>
              {data.trendPoints.map((point, pointIndex) => {
                const isFocused = selectedTrendPoint?.label === point.label;

                return (
                  <Pressable
                    key={point.label}
                    onPress={() => setFocusedPointIndex(pointIndex)}
                    style={styles.timelineItem}
                    hitSlop={6}>
                    <Text style={[styles.timelineLabel, isFocused ? styles.timelineLabelFocused : null]}>
                      {point.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {selectedTrendPoint ? (
              <Text style={styles.focusValueText}>
                {selectedTrendPoint.label}: {selectedTrendPoint.value} {data.temperatureUnit}
              </Text>
            ) : null}
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCard}>
              <View style={styles.gridCardTopRow}>
                <Text style={styles.gridCardLabel}>Wind Speed</Text>
                <MaterialIcons name="air" size={18} color={COLORS.primarySoft} />
              </View>
              <View style={styles.gridCardValueWrap}>
                <Text style={styles.gridCardValue}>{data.windSpeedValue}</Text>
                <Text style={styles.gridCardValueSuffix}>{data.windSpeedUnit}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: '35%' }]} />
              </View>
            </View>

            <View style={styles.gridCard}>
              <View style={styles.gridCardTopRow}>
                <Text style={styles.gridCardLabel}>UV Index</Text>
                <MaterialIcons name="wb-sunny" size={18} color={COLORS.primarySoft} />
              </View>
              <View style={styles.gridCardValueWrap}>
                <Text style={styles.gridCardValue}>{data.uvIndexValue}</Text>
                <Text style={styles.gridCardValueSuffix}>{data.uvIndexLabel}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: '40%' }]} />
              </View>
            </View>

            <View style={styles.gridCard}>
              <View style={styles.gridCardTopRow}>
                <Text style={styles.gridCardLabel}>Pressure</Text>
                <MaterialIcons name="compress" size={18} color={COLORS.primarySoft} />
              </View>
              <View style={styles.gridCardValueWrap}>
                <Text style={styles.gridCardValue}>{data.pressureValue}</Text>
                <Text style={styles.gridCardValueSuffix}>{data.pressureUnit}</Text>
              </View>
              <View style={styles.statusWrap}>
                <MaterialIcons name="arrow-upward" size={12} color={COLORS.primary} />
                <Text style={styles.statusText}>Rising Stable</Text>
              </View>
            </View>
          </View>

          <ImageBackground source={{ uri: data.moodImageUrl }} resizeMode="cover" style={styles.moodImageWrap}>
            <View style={styles.moodImageOverlay}>
              <Text style={styles.quoteText}>{`"${data.quoteText}"`}</Text>
            </View>
          </ImageBackground>
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
  heroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  heroTextWrap: {
    flex: 1,
    gap: 10,
  },
  locationText: {
    color: COLORS.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 2.1,
    fontWeight: '700',
  },
  tempWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tempValue: {
    color: COLORS.primary,
    fontSize: 86,
    fontWeight: '800',
    lineHeight: 92,
    letterSpacing: -2,
  },
  tempUnit: {
    color: COLORS.primary,
    fontSize: 44,
    fontWeight: '700',
    lineHeight: 44,
    marginTop: 10,
    marginLeft: 2,
  },
  heroMetaWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  metaItemWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaDivider: {
    width: 1,
    height: 14,
    backgroundColor: COLORS.outline,
  },
  metaText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  heroOrbWrap: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroOrbGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    opacity: 0.2,
  },
  cardLarge: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    shadowColor: '#191c1e',
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  cardLargeHeader: {
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
  },
  cardLargeTitle: {
    color: COLORS.textMain,
    fontSize: 24,
    fontWeight: '800',
  },
  cardLargeSubtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 2,
  },
  deltaText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '700',
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
  timelineLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.3,
  },
  timelineLabelFocused: {
    color: COLORS.primary,
  },
  focusValueText: {
    marginTop: 6,
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gridCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 12,
    minHeight: 146,
    justifyContent: 'space-between',
  },
  gridCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  gridCardLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  gridCardValueWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  gridCardValue: {
    color: COLORS.textMain,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 32,
  },
  gridCardValueSuffix: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  progressTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: COLORS.cardAlt,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  statusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statusText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  moodImageWrap: {
    height: 192,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#d0d5dd',
  },
  moodImageOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(25, 28, 30, 0.36)',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  quoteText: {
    color: '#ffffff',
    fontSize: 13,
    fontStyle: 'italic',
    fontWeight: '500',
    opacity: 0.95,
  },
});
