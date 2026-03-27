import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SettingsData, fetchSettingsTemplate } from '@/lib/weather-data-template';

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

type ToggleControlProps = {
  value: boolean;
  onPress: () => void;
};

function ToggleControl({ value, onPress }: ToggleControlProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      style={[styles.toggleTrack, value ? styles.toggleTrackEnabled : styles.toggleTrackDisabled]}>
      <View style={[styles.toggleThumb, value ? styles.toggleThumbEnabled : styles.toggleThumbDisabled]} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [temperatureUnit, setTemperatureUnit] = useState<'C' | 'F'>('C');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const payload = await fetchSettingsTemplate();
        if (!isMounted) {
          return;
        }

        setData(payload);
        setTemperatureUnit(payload.temperatureUnit);
        setNotificationsEnabled(payload.notificationsEnabled);
        setDarkModeEnabled(payload.darkModeEnabled);
      } catch (caughtError) {
        if (!isMounted) {
          return;
        }
        const message = caughtError instanceof Error ? caughtError.message : 'Unknown error';
        setError(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerBrandWrap}>
          <MaterialIcons name="cloud" size={24} color={COLORS.primary} />
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
        <Pressable accessibilityRole="button" hitSlop={10}>
          <MaterialIcons name="notifications" size={24} color={COLORS.textMuted} />
        </Pressable>
      </View>
      <View style={styles.headerDivider} />

      {loading ? (
        <View style={styles.stateWrap}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.stateText}>Loading settings...</Text>
        </View>
      ) : error ? (
        <View style={styles.stateWrap}>
          <MaterialIcons name="error-outline" size={18} color="#ba1a1a" />
          <Text style={styles.stateText}>Could not load settings: {error}</Text>
        </View>
      ) : data ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Account and Connectivity</Text>
            <View style={styles.cardWrap}>
              <Pressable style={[styles.cardRow, styles.cardRowDivider]} accessibilityRole="button">
                <View style={styles.rowIconWrapPrimary}>
                  <MaterialIcons name="router" size={22} color={COLORS.primary} />
                </View>
                <View style={styles.rowCopyWrap}>
                  <Text style={styles.rowTitle}>Device Connectivity</Text>
                  <Text style={styles.rowSubtitle}>Manage station Wi-Fi and Bluetooth</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={COLORS.textMuted} />
              </Pressable>

              <Pressable style={styles.cardRow} accessibilityRole="button">
                <View style={styles.rowIconWrapPrimary}>
                  <MaterialIcons name="person" size={22} color={COLORS.primary} />
                </View>
                <View style={styles.rowCopyWrap}>
                  <Text style={styles.rowTitle}>User Profile</Text>
                  <Text style={styles.rowSubtitle}>Cloud sync and data export</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={COLORS.textMuted} />
              </Pressable>
            </View>
          </View>

          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Data and Units</Text>
            <View style={styles.cardWrap}>
              <View style={[styles.cardRow, styles.cardRowDivider]}>
                <View style={styles.rowIconWrapMuted}>
                  <MaterialIcons name="thermostat" size={22} color="#374151" />
                </View>
                <View style={styles.rowCopyWrap}>
                  <Text style={styles.rowTitle}>Temperature Units</Text>
                  <Text style={styles.rowSubtitle}>Display in Celsius or Fahrenheit</Text>
                </View>

                <View style={styles.segmentedControlWrap}>
                  <Pressable
                    onPress={() => setTemperatureUnit('C')}
                    style={[
                      styles.segmentButton,
                      temperatureUnit === 'C' ? styles.segmentButtonActive : styles.segmentButtonInactive,
                    ]}>
                    <Text
                      style={[
                        styles.segmentButtonText,
                        temperatureUnit === 'C' ? styles.segmentButtonTextActive : styles.segmentButtonTextInactive,
                      ]}>
                      C
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setTemperatureUnit('F')}
                    style={[
                      styles.segmentButton,
                      temperatureUnit === 'F' ? styles.segmentButtonActive : styles.segmentButtonInactive,
                    ]}>
                    <Text
                      style={[
                        styles.segmentButtonText,
                        temperatureUnit === 'F' ? styles.segmentButtonTextActive : styles.segmentButtonTextInactive,
                      ]}>
                      F
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={[styles.cardRow, styles.cardRowDivider]}>
                <View style={styles.rowIconWrapMuted}>
                  <MaterialIcons name="air" size={22} color="#374151" />
                </View>
                <View style={styles.rowCopyWrap}>
                  <Text style={styles.rowTitle}>Wind Speed</Text>
                  <Text style={styles.rowSubtitle}>km/h, mph, or knots</Text>
                </View>
                <Text style={styles.trailingValue}>{data.windSpeedUnit}</Text>
              </View>

              <View style={styles.cardRow}>
                <View style={styles.rowIconWrapMuted}>
                  <MaterialIcons name="compress" size={22} color="#374151" />
                </View>
                <View style={styles.rowCopyWrap}>
                  <Text style={styles.rowTitle}>Pressure Units</Text>
                  <Text style={styles.rowSubtitle}>hPa, inHg, or mmHg</Text>
                </View>
                <Text style={styles.trailingValue}>{data.pressureUnit}</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>System Preferences</Text>
            <View style={styles.cardWrap}>
              <View style={[styles.cardRow, styles.cardRowDivider]}>
                <View style={styles.rowIconWrapMuted}>
                  <MaterialIcons name="notifications-active" size={22} color="#374151" />
                </View>
                <View style={styles.rowCopyWrap}>
                  <Text style={styles.rowTitle}>Notification Preferences</Text>
                  <Text style={styles.rowSubtitle}>Critical alerts and daily summaries</Text>
                </View>
                <ToggleControl
                  value={notificationsEnabled}
                  onPress={() => setNotificationsEnabled((currentValue) => !currentValue)}
                />
              </View>

              <View style={styles.cardRow}>
                <View style={styles.rowIconWrapMuted}>
                  <MaterialIcons name="dark-mode" size={22} color="#374151" />
                </View>
                <View style={styles.rowCopyWrap}>
                  <Text style={styles.rowTitle}>Appearance</Text>
                  <Text style={styles.rowSubtitle}>Switch between Light and Dark mode</Text>
                </View>
                <ToggleControl value={darkModeEnabled} onPress={() => setDarkModeEnabled((currentValue) => !currentValue)} />
              </View>
            </View>
          </View>

          <View style={styles.versionWrap}>
            <View style={styles.versionImageFrame}>
              <Image source={{ uri: data.versionImageUrl }} style={styles.versionImage} resizeMode="cover" />
              <View style={styles.versionImageOverlay} />
            </View>
            <Text style={styles.versionText}>{data.appVersionLabel}</Text>
            <Text style={styles.versionSubtext}>{data.appTagline}</Text>
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
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    paddingHorizontal: 4,
  },
  cardWrap: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  cardRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#eceef1',
  },
  rowIconWrapPrimary: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: '#d1e4ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconWrapMuted: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: COLORS.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopyWrap: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    color: COLORS.textMain,
    fontSize: 32 / 2,
    fontWeight: '700',
  },
  rowSubtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 19,
  },
  segmentedControlWrap: {
    flexDirection: 'row',
    backgroundColor: '#e1e5eb',
    borderRadius: 999,
    padding: 3,
    gap: 3,
  },
  segmentButton: {
    minWidth: 48,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#191c1e',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  segmentButtonInactive: {
    backgroundColor: 'transparent',
  },
  segmentButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  segmentButtonTextActive: {
    color: COLORS.primary,
  },
  segmentButtonTextInactive: {
    color: COLORS.textMuted,
  },
  trailingValue: {
    color: COLORS.primary,
    fontSize: 27 / 2,
    fontWeight: '700',
  },
  toggleTrack: {
    width: 50,
    height: 30,
    borderRadius: 999,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  toggleTrackEnabled: {
    backgroundColor: COLORS.primary,
  },
  toggleTrackDisabled: {
    backgroundColor: '#d4d9e0',
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: '#ffffff',
  },
  toggleThumbEnabled: {
    alignSelf: 'flex-end',
  },
  toggleThumbDisabled: {
    alignSelf: 'flex-start',
  },
  versionWrap: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 16,
  },
  versionImageFrame: {
    width: '100%',
    height: 180,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#d6d9df',
  },
  versionImage: {
    width: '100%',
    height: '100%',
    opacity: 0.2,
  },
  versionImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f7f9fc',
    opacity: 0.22,
  },
  versionText: {
    marginTop: 10,
    color: '#adb3c2',
    fontSize: 34 / 2,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  versionSubtext: {
    color: '#6f7688',
    fontSize: 25 / 2,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
