import { supabase } from '@/lib/supabase';
import { fetchWeatherApi } from 'openmeteo';

export type WeatherTrendPoint = {
  label: string;
  value: number;
};

export type WeatherInsertEvent = {
  createdAt: string;
  temperature: number;
  humidity: number;
};

export type DashboardWeatherIconName = 'wb-sunny' | 'wb-cloudy' | 'cloud-queue' | 'cloud';

export type CurrentWeatherData = {
  locationLabel: string;
  temperatureValue: number;
  temperatureUnit: 'C' | 'F';
  humidityPercent: number;
  weatherIconName: DashboardWeatherIconName;
  windSpeedValue: number;
  windSpeedUnit: string;
  windDirection: string;
  uvIndexValue: number;
  uvIndexLabel: string;
  pressureValue: number;
  pressureUnit: string;
  trendDeltaLabel: string;
  trendPoints: WeatherTrendPoint[];
  quoteText: string;
  moodImageUrl: string;
};

export type HistoryDayChip = {
  id: string;
  weekdayLabel: string;
  dayOfMonth: number;
  state: 'inactive' | 'range' | 'selected';
};

export type HistoryRecord = {
  id: string;
  dateLabel: string;
  summaryLabel: string;
  highTemp: number;
  lowTemp: number;
  humidityPercent: number;
  iconName: 'sunny' | 'partly_cloudy' | 'rain';
};

export type HistoryData = {
  monthLabel: string;
  dayChips: HistoryDayChip[];
  selectedDayId: string;
  activeMetric: 'temperature' | 'humidity';
  trendsByDayId: Record<
    string,
    {
      temperatureTrendPoints: WeatherTrendPoint[];
      humidityTrendPoints: WeatherTrendPoint[];
    }
  >;
  tooltipLabel: string;
  tooltipValue: string;
  records: HistoryRecord[];
};

export type SettingsData = {
  temperatureUnit: 'C' | 'F';
  windSpeedUnit: string;
  pressureUnit: string;
  notificationsEnabled: boolean;
  darkModeEnabled: boolean;
  appVersionLabel: string;
  appTagline: string;
  versionImageUrl: string;
};

/**
 * DATABASE TEMPLATE SECTION
 * This now matches your one-table schema.
 */
export const WEATHER_DB_TEMPLATE = {
  tables: {
    // TODO(DB_TABLE): Set this to your exact Supabase table name.
    weatherReadings: 'temperature_and_humidity',
    // Optional future table if you later persist user preferences.
    userSettings: 'user_settings',
  },
  fields: {
    weatherReadings: {
      // TODO(DB_FIELDS): Set these to your exact column names.
      createdAt: 'created_at',
      temperature: 'temperature',
      humidity: 'humidity',
    },
    userSettings: {
      temperatureUnit: 'temperature_unit',
      windSpeedUnit: 'wind_speed_unit',
      pressureUnit: 'pressure_unit',
      notificationsEnabled: 'notifications_enabled',
      darkModeEnabled: 'dark_mode_enabled',
    },
  },
} as const;

/**
 * Optional enrichment API (kept separate from Supabase table data):
 * Open-Meteo can provide pressure, wind and UV for free.
 */
export const EXTRA_WEATHER_API_TEMPLATE = {
  provider: 'Open-Meteo',
  endpoint: 'https://api.open-meteo.com/v1/forecast',
  queryExample:
    '?latitude=37.7749&longitude=-122.4194&current=surface_pressure,wind_speed_10m,wind_direction_10m,uv_index',
  notes: 'No API key for non-commercial use. Commercial traffic requires customer API key.',
} as const;

type WeatherReadingRow = {
  createdAt: string;
  temperature: number;
  humidity: number;
};

let realtimeSubscriptionCounter = 0;

const MOCK_CURRENT_WEATHER: CurrentWeatherData = {
  locationLabel: 'Weather Station',
  temperatureValue: 22,
  temperatureUnit: 'C',
  humidityPercent: 45,
  weatherIconName: 'wb-cloudy',
  windSpeedValue: 12,
  windSpeedUnit: 'km/h',
  windDirection: 'NW',
  uvIndexValue: 4,
  uvIndexLabel: 'Moderate',
  pressureValue: 1012,
  pressureUnit: 'hPa',
  trendDeltaLabel: '+0.0 from previous',
  trendPoints: [
    { label: '12 AM', value: 19 },
    { label: '6 AM', value: 18 },
    { label: '12 PM', value: 22 },
    { label: '6 PM', value: 21 },
    { label: 'Now', value: 22 },
  ],
  quoteText: 'The atmosphere is the key to the music of the spheres.',
  moodImageUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCxn1HmCKWZWoGIbT5a7uiWC4agtfcc1YxkTWZz00q6pKiFmb7QOayf2I2iKIfT887ve9UPgUMRvf-oTs0_vKnJVXlcacm9wiHXlkAX2seBRjCTcAHIOpa7ASoYEX3gc0QhomNgfBII0ae9V4KeXGaaP60R9clfx9wzLNxqK4hpT9BDilE0PTrJJYMowgbXzFRgyzohzEHG7_13jWutnYijjJzqD5LqMCha8p773ZTbF4MSpcdfI2rYusRblYSc5FBNd5Wvz7dyzB7A',
};

const MOCK_HISTORY: HistoryData = {
  monthLabel: 'October 2023',
  dayChips: [
    { id: '16', weekdayLabel: 'Mon', dayOfMonth: 16, state: 'inactive' },
    { id: '17', weekdayLabel: 'Tue', dayOfMonth: 17, state: 'inactive' },
    { id: '18', weekdayLabel: 'Wed', dayOfMonth: 18, state: 'selected' },
    { id: '19', weekdayLabel: 'Thu', dayOfMonth: 19, state: 'range' },
    { id: '20', weekdayLabel: 'Fri', dayOfMonth: 20, state: 'range' },
    { id: '21', weekdayLabel: 'Sat', dayOfMonth: 21, state: 'range' },
    { id: '22', weekdayLabel: 'Sun', dayOfMonth: 22, state: 'range' },
  ],
  selectedDayId: '22',
  activeMetric: 'temperature',
  trendsByDayId: {
    '22': {
      temperatureTrendPoints: [
        { label: '12 AM', value: 18 },
        { label: '6 AM', value: 19 },
        { label: '12 PM', value: 24 },
        { label: '6 PM', value: 22 },
        { label: '11 PM', value: 21 },
      ],
      humidityTrendPoints: [
        { label: '12 AM', value: 68 },
        { label: '6 AM', value: 64 },
        { label: '12 PM', value: 49 },
        { label: '6 PM', value: 57 },
        { label: '11 PM', value: 61 },
      ],
    },
  },
  tooltipLabel: 'Oct 21',
  tooltipValue: '24 C',
  records: [
    {
      id: 'oct-22',
      dateLabel: 'Sunday, Oct 22',
      summaryLabel: 'Predominantly clear skies',
      highTemp: 26,
      lowTemp: 18,
      humidityPercent: 42,
      iconName: 'sunny',
    },
    {
      id: 'oct-21',
      dateLabel: 'Saturday, Oct 21',
      summaryLabel: 'Variable cloud cover',
      highTemp: 24,
      lowTemp: 17,
      humidityPercent: 51,
      iconName: 'partly_cloudy',
    },
    {
      id: 'oct-20',
      dateLabel: 'Friday, Oct 20',
      summaryLabel: 'Localized showers',
      highTemp: 21,
      lowTemp: 15,
      humidityPercent: 78,
      iconName: 'rain',
    },
  ],
};

const MOCK_SETTINGS: SettingsData = {
  temperatureUnit: 'C',
  windSpeedUnit: 'km/h',
  pressureUnit: 'hPa',
  notificationsEnabled: true,
  darkModeEnabled: false,
  appVersionLabel: 'Version 4.2.0-Aurora',
  appTagline: 'Precision Engineering for the Atmosphere',
  versionImageUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBTuisa4tY0Q2AWNxu8BGJc0ndjYrlVXuCSBO-KSmjE5wkcmxM2vdhVGaglw9D3pK0ZCdSKRvlF4DxxBifKkfVjQeApLJouE3vtg2pJvvwWkLTgOQO3EqjhChzNgQLCEQEU51BmcENT18jf7mpMeK3Q32Y2WakLT10muQpFEhQxmnph_H98_AM4EXC15xngcYjLt-g36q666EKVeWEADcjVKRlaxAs_2Ip3oyEAtjkyauysVqe81HwsZOQkOqnlVKx4tNnB5DvMeVrY',
};

const OPEN_METEO_DASHBOARD_FORECAST = {
  latitude: 49.630615,
  longitude: 20.93517,
  timezone: 'Europe/Warsaw',
  forecastDays: 1,
} as const;

const OPEN_METEO_CACHE_TTL_MS = 10 * 60 * 1000;
const CLOUD_ICON_THRESHOLDS = {
  sunnyMaxPercent: 15,
  partlyCloudyMaxPercent: 50,
} as const;

type OpenMeteoDashboardForecast = {
  temperatureValue: number;
  humidityPercent: number;
  windSpeedValue: number;
  windDirection: string;
  pressureValue: number;
  uvIndexValue: number;
  uvIndexLabel: string;
  trendDeltaLabel: string;
  trendPoints: WeatherTrendPoint[];
  cloudCoverPercent: number;
};

let openMeteoDashboardCache:
  | {
      expiresAt: number;
      value: OpenMeteoDashboardForecast;
    }
  | null = null;

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}

function toDayKey(dateValue: Date): string {
  const year = dateValue.getFullYear();
  const month = (dateValue.getMonth() + 1).toString().padStart(2, '0');
  const day = dateValue.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfLocalDay(dateValue: Date): Date {
  const date = new Date(dateValue);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addLocalDays(dateValue: Date, days: number): Date {
  const date = new Date(dateValue);
  date.setDate(date.getDate() + days);
  return date;
}

function formatHourLabel(hour: number): string {
  if (hour === 0) {
    return '12 AM';
  }
  if (hour === 12) {
    return '12 PM';
  }
  if (hour < 12) {
    return `${hour} AM`;
  }
  return `${hour - 12} PM`;
}

function toSafeNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function resolveDashboardIconName(cloudCoverPercent: number): DashboardWeatherIconName {
  if (cloudCoverPercent < CLOUD_ICON_THRESHOLDS.sunnyMaxPercent) {
    return 'wb-sunny';
  }

  if (cloudCoverPercent <= CLOUD_ICON_THRESHOLDS.partlyCloudyMaxPercent) {
    return 'cloud-queue';
  }

  return 'wb-cloudy';
}

function uvIndexToLabel(uvIndexValue: number): string {
  if (uvIndexValue < 3) {
    return 'Low';
  }

  if (uvIndexValue < 6) {
    return 'Moderate';
  }

  if (uvIndexValue < 8) {
    return 'High';
  }

  if (uvIndexValue < 11) {
    return 'Very High';
  }

  return 'Extreme';
}

function degreesToWindDirectionLabel(directionDegrees: number): string {
  const compassLabels = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const normalized = ((directionDegrees % 360) + 360) % 360;
  const directionIndex = Math.round(normalized / 45) % compassLabels.length;
  return compassLabels[directionIndex];
}

function valueAtIndex(values: Float32Array | null | undefined, index: number, fallback: number): number {
  if (!values || values.length === 0) {
    return fallback;
  }

  const safeIndex = clamp(index, 0, values.length - 1);
  const candidate = values[safeIndex];
  return Number.isFinite(candidate) ? candidate : fallback;
}

function getCurrentHourInWarsaw(): number {
  const hourToken = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    hour12: false,
    timeZone: OPEN_METEO_DASHBOARD_FORECAST.timezone,
  }).format(new Date());

  const parsedHour = Number(hourToken);
  return Number.isFinite(parsedHour) ? clamp(parsedHour, 0, 23) : 0;
}

function buildOpenMeteoTrendPoints(
  temperatureSeries: Float32Array | null | undefined,
  currentHour: number
): WeatherTrendPoint[] {
  const anchorHours = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].filter((hour) => hour < currentHour);
  const hours = [...anchorHours, currentHour];

  return hours.map((hour, index) => ({
    label: index === hours.length - 1 ? 'Now' : formatHourLabel(hour),
    value: roundOne(valueAtIndex(temperatureSeries, hour, MOCK_CURRENT_WEATHER.temperatureValue)),
  }));
}

async function fetchOpenMeteoDashboardForecast(): Promise<OpenMeteoDashboardForecast | null> {
  const now = Date.now();
  if (openMeteoDashboardCache && openMeteoDashboardCache.expiresAt > now) {
    return openMeteoDashboardCache.value;
  }

  const params = {
    latitude: OPEN_METEO_DASHBOARD_FORECAST.latitude,
    longitude: OPEN_METEO_DASHBOARD_FORECAST.longitude,
    daily: 'uv_index_max',
    hourly: [
      'temperature_2m',
      'relative_humidity_2m',
      'wind_speed_10m',
      'wind_direction_10m',
      'surface_pressure',
      'cloud_cover',
    ],
    timezone: OPEN_METEO_DASHBOARD_FORECAST.timezone,
    forecast_days: OPEN_METEO_DASHBOARD_FORECAST.forecastDays,
  };

  try {
    const responses = await fetchWeatherApi(EXTRA_WEATHER_API_TEMPLATE.endpoint, params);
    const response = responses[0];
    if (!response) {
      return null;
    }

    const hourly = response.hourly();
    const daily = response.daily();
    if (!hourly || !daily) {
      return null;
    }

    const currentWarsawHour = getCurrentHourInWarsaw();
    const temperatureSeries = hourly.variables(0)?.valuesArray();
    const humiditySeries = hourly.variables(1)?.valuesArray();
    const windSpeedSeries = hourly.variables(2)?.valuesArray();
    const windDirectionSeries = hourly.variables(3)?.valuesArray();
    const pressureSeries = hourly.variables(4)?.valuesArray();
    const cloudCoverSeries = hourly.variables(5)?.valuesArray();
    const dailyUvSeries = daily.variables(0)?.valuesArray();

    const temperatureValue = roundOne(
      valueAtIndex(temperatureSeries, currentWarsawHour, MOCK_CURRENT_WEATHER.temperatureValue)
    );
    const previousTemperatureValue = roundOne(
      valueAtIndex(
        temperatureSeries,
        Math.max(0, currentWarsawHour - 1),
        MOCK_CURRENT_WEATHER.temperatureValue
      )
    );
    const deltaValue = roundOne(temperatureValue - previousTemperatureValue);
    const deltaPrefix = deltaValue >= 0 ? '+' : '';
    const windDirectionDegrees = valueAtIndex(
      windDirectionSeries,
      currentWarsawHour,
      315
    );
    const cloudCoverPercent = Math.round(
      clamp(valueAtIndex(cloudCoverSeries, currentWarsawHour, 50), 0, 100)
    );
    const uvIndexValue = roundOne(valueAtIndex(dailyUvSeries, 0, MOCK_CURRENT_WEATHER.uvIndexValue));

    const forecast: OpenMeteoDashboardForecast = {
      temperatureValue,
      humidityPercent: Math.round(
        valueAtIndex(humiditySeries, currentWarsawHour, MOCK_CURRENT_WEATHER.humidityPercent)
      ),
      windSpeedValue: roundOne(
        valueAtIndex(windSpeedSeries, currentWarsawHour, MOCK_CURRENT_WEATHER.windSpeedValue)
      ),
      windDirection: degreesToWindDirectionLabel(windDirectionDegrees),
      pressureValue: Math.round(
        valueAtIndex(pressureSeries, currentWarsawHour, MOCK_CURRENT_WEATHER.pressureValue)
      ),
      uvIndexValue,
      uvIndexLabel: uvIndexToLabel(uvIndexValue),
      trendDeltaLabel: `${deltaPrefix}${deltaValue} from previous`,
      trendPoints: buildOpenMeteoTrendPoints(temperatureSeries, currentWarsawHour),
      cloudCoverPercent,
    };

    openMeteoDashboardCache = {
      expiresAt: now + OPEN_METEO_CACHE_TTL_MS,
      value: forecast,
    };

    return forecast;
  } catch {
    return null;
  }
}

function buildCurrentWeatherFromOpenMeteo(
  forecast: OpenMeteoDashboardForecast
): CurrentWeatherData {
  return {
    ...MOCK_CURRENT_WEATHER,
    temperatureValue: forecast.temperatureValue,
    humidityPercent: forecast.humidityPercent,
    weatherIconName: resolveDashboardIconName(forecast.cloudCoverPercent),
    windSpeedValue: forecast.windSpeedValue,
    windDirection: forecast.windDirection,
    uvIndexValue: forecast.uvIndexValue,
    uvIndexLabel: forecast.uvIndexLabel,
    pressureValue: forecast.pressureValue,
    trendDeltaLabel: forecast.trendDeltaLabel,
    trendPoints: forecast.trendPoints.length ? forecast.trendPoints : MOCK_CURRENT_WEATHER.trendPoints,
  };
}

function parseDate(value: string): Date {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return new Date();
  }
  return parsedDate;
}

function parseTimestampParts(value: string): { dayKey: string; hour: number } | null {
  const normalizedValue = value.trim().replace(' ', 'T');
  const match = normalizedValue.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2})/);

  if (!match) {
    return null;
  }

  const [, year, month, day, hourToken] = match;
  const parsedHour = Number(hourToken);
  const safeHour = Number.isFinite(parsedHour) ? Math.max(0, Math.min(23, parsedHour)) : 0;

  return {
    dayKey: `${year}-${month}-${day}`,
    hour: safeHour,
  };
}

function getRowDayKey(createdAt: string): string {
  const parsed = parseTimestampParts(createdAt);
  if (parsed) {
    return parsed.dayKey;
  }

  return toDayKey(parseDate(createdAt));
}

function getRowHour(createdAt: string): number {
  const parsed = parseTimestampParts(createdAt);
  if (parsed) {
    return parsed.hour;
  }

  return parseDate(createdAt).getHours();
}

function formatWeekday(dateValue: Date): string {
  return dateValue.toLocaleDateString('en-US', { weekday: 'short' });
}

function formatMonthLabel(dateValue: Date): string {
  return dateValue.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatRecordDate(dateValue: Date): string {
  return dateValue.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function humiditySummary(humidity: number): string {
  if (humidity >= 75) {
    return 'High humidity conditions';
  }
  if (humidity >= 50) {
    return 'Moderate humidity conditions';
  }
  return 'Dry air conditions';
}

function iconFromHumidity(humidity: number): HistoryRecord['iconName'] {
  if (humidity >= 75) {
    return 'rain';
  }
  if (humidity >= 50) {
    return 'partly_cloudy';
  }
  return 'sunny';
}

function buildLatestRowsByHour(rowsDesc: WeatherReadingRow[]): Map<number, WeatherReadingRow> {
  const latestByHour = new Map<number, WeatherReadingRow>();

  rowsDesc.forEach((row) => {
    const hour = getRowHour(row.createdAt);
    if (!latestByHour.has(hour)) {
      latestByHour.set(hour, row);
    }
  });

  return latestByHour;
}

function backfillHourlySeries(values: (number | null)[]): number[] {
  const copied = [...values];

  const firstKnownValue = copied.find((value): value is number => value !== null) ?? 0;

  // Fill any leading gaps with the first observed value for the period.
  for (let index = 0; index < copied.length; index += 1) {
    if (copied[index] === null) {
      copied[index] = firstKnownValue;
      continue;
    }
    break;
  }

  let previousValue: number | null = null;
  for (let index = 0; index < copied.length; index += 1) {
    if (copied[index] !== null) {
      previousValue = copied[index];
    } else if (previousValue !== null) {
      copied[index] = previousValue;
    }
  }

  return copied.map((value) => roundOne(value ?? 0));
}

function buildHourlyTrendPoints(
  rowsDesc: WeatherReadingRow[],
  endHour: number,
  metric: 'temperature' | 'humidity',
  markLastAsNow: boolean
): WeatherTrendPoint[] {
  const latestByHour = buildLatestRowsByHour(rowsDesc);
  const rawSeries: (number | null)[] = [];

  for (let hour = 0; hour <= endHour; hour += 1) {
    const row = latestByHour.get(hour);
    rawSeries.push(row ? row[metric] : null);
  }

  const values = backfillHourlySeries(rawSeries);

  return values.map((value, index) => ({
    label: markLastAsNow && index === values.length - 1 ? 'Now' : formatHourLabel(index),
    value,
  }));
}

function filterRowsForDay(rowsDesc: WeatherReadingRow[], dayStart: Date): WeatherReadingRow[] {
  const targetDayKey = toDayKey(dayStart);
  return rowsDesc.filter((row) => getRowDayKey(row.createdAt) === targetDayKey);
}

function toDayChip(dayStart: Date, selectedDayId: string): HistoryDayChip {
  const dayKey = toDayKey(dayStart);
  return {
    id: dayKey,
    weekdayLabel: formatWeekday(dayStart),
    dayOfMonth: dayStart.getDate(),
    state: dayKey === selectedDayId ? 'selected' : 'range',
  };
}

function buildDailyRecord(dayStart: Date, rowsDesc: WeatherReadingRow[]): HistoryRecord {
  const dayKey = toDayKey(dayStart);

  if (!rowsDesc.length) {
    return {
      id: dayKey,
      dateLabel: formatRecordDate(dayStart),
      summaryLabel: 'No readings captured',
      highTemp: 0,
      lowTemp: 0,
      humidityPercent: 0,
      iconName: 'partly_cloudy',
    };
  }

  const temperatures = rowsDesc.map((row) => row.temperature);
  const averageHumidity = rowsDesc.reduce((sum, row) => sum + row.humidity, 0) / rowsDesc.length;

  return {
    id: dayKey,
    dateLabel: formatRecordDate(dayStart),
    summaryLabel: humiditySummary(averageHumidity),
    highTemp: Math.round(Math.max(...temperatures)),
    lowTemp: Math.round(Math.min(...temperatures)),
    humidityPercent: Math.round(averageHumidity),
    iconName: iconFromHumidity(averageHumidity),
  };
}

async function fetchWeatherRows(options: { limit: number; sinceIso?: string }): Promise<WeatherReadingRow[]> {
  const tableName = WEATHER_DB_TEMPLATE.tables.weatherReadings;
  const fields = WEATHER_DB_TEMPLATE.fields.weatherReadings;
  const { limit, sinceIso } = options;

  // TODO(DB_TABLE): Change tableName if your weather table has a different name.
  // TODO(DB_FIELDS): Change fields.createdAt / fields.temperature / fields.humidity to match your schema.
  let query = supabase
    .from(tableName)
    .select(`${fields.createdAt},${fields.temperature},${fields.humidity}`);

  if (sinceIso) {
    query = query.gte(fields.createdAt, sinceIso);
  }

  query = query.order(fields.createdAt, { ascending: false }).limit(limit);

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  if (!data || !Array.isArray(data)) {
    return [];
  }

  const normalizedRows = data
    .map((row) => {
      const typedRow = row as Record<string, unknown>;
      const createdAtValue = typedRow[fields.createdAt];

      if (typeof createdAtValue !== 'string' || !createdAtValue.trim()) {
        return null;
      }

      return {
        createdAt: createdAtValue,
        temperature: toSafeNumber(typedRow[fields.temperature], 0),
        humidity: toSafeNumber(typedRow[fields.humidity], 0),
      };
    })
    .filter((row): row is WeatherReadingRow => row !== null);

  return normalizedRows;
}

export function subscribeToNewWeatherRows(
  onInsert: (event: WeatherInsertEvent) => void,
  onStatusIssue?: (message: string) => void
): () => void {
  const tableName = WEATHER_DB_TEMPLATE.tables.weatherReadings;
  const fields = WEATHER_DB_TEMPLATE.fields.weatherReadings;
  const channelName = `weather-readings-insert-${tableName}-${Date.now()}-${realtimeSubscriptionCounter++}`;

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: tableName,
      },
      (payload) => {
        const inserted = payload.new as Record<string, unknown>;
        const createdAtValue = inserted[fields.createdAt];

        if (typeof createdAtValue !== 'string' || !createdAtValue.trim()) {
          return;
        }

        onInsert({
          createdAt: createdAtValue,
          temperature: toSafeNumber(inserted[fields.temperature], 0),
          humidity: toSafeNumber(inserted[fields.humidity], 0),
        });
      }
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        onStatusIssue?.(`Realtime subscription issue: ${status}`);
      }
    });

  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function fetchCurrentWeatherTemplate(): Promise<CurrentWeatherData> {
  const todayStart = startOfLocalDay(new Date());
  const currentHour = new Date().getHours();
  const [rowsDesc, openMeteoForecast] = await Promise.all([
    fetchWeatherRows({
      limit: 1000,
      sinceIso: todayStart.toISOString(),
    }),
    fetchOpenMeteoDashboardForecast(),
  ]);

  const openMeteoPatch = openMeteoForecast
    ? {
        windSpeedValue: openMeteoForecast.windSpeedValue,
        windDirection: openMeteoForecast.windDirection,
        pressureValue: openMeteoForecast.pressureValue,
        uvIndexValue: openMeteoForecast.uvIndexValue,
        uvIndexLabel: openMeteoForecast.uvIndexLabel,
        weatherIconName: resolveDashboardIconName(openMeteoForecast.cloudCoverPercent),
      }
    : null;

  if (!rowsDesc.length) {
    if (openMeteoForecast) {
      return buildCurrentWeatherFromOpenMeteo(openMeteoForecast);
    }

    return {
      ...MOCK_CURRENT_WEATHER,
      ...(openMeteoPatch ?? {}),
    };
  }

  const rowsForToday = filterRowsForDay(rowsDesc, todayStart);
  if (!rowsForToday.length) {
    if (openMeteoForecast) {
      return buildCurrentWeatherFromOpenMeteo(openMeteoForecast);
    }

    return {
      ...MOCK_CURRENT_WEATHER,
      ...(openMeteoPatch ?? {}),
    };
  }

  const latestByHour = buildLatestRowsByHour(rowsForToday);
  const hourlyRowsAsc = Array.from(latestByHour.entries())
    .sort((left, right) => left[0] - right[0])
    .map(([, row]) => row);

  const latest = hourlyRowsAsc[hourlyRowsAsc.length - 1] ?? rowsForToday[0];
  const previous = hourlyRowsAsc[hourlyRowsAsc.length - 2] ?? latest;
  const trendPoints = buildHourlyTrendPoints(rowsForToday, currentHour, 'temperature', true);
  const deltaValue = roundOne(latest.temperature - previous.temperature);
  const deltaPrefix = deltaValue >= 0 ? '+' : '';

  return {
    ...MOCK_CURRENT_WEATHER,
    ...(openMeteoPatch ?? {}),
    temperatureValue: roundOne(latest.temperature),
    humidityPercent: Math.round(latest.humidity),
    trendDeltaLabel: `${deltaPrefix}${deltaValue} from previous`,
    trendPoints: trendPoints.length ? trendPoints : MOCK_CURRENT_WEATHER.trendPoints,
  };
}

export async function fetchHistoryTemplate(): Promise<HistoryData> {
  const todayStart = startOfLocalDay(new Date());
  const oldestDayStart = addLocalDays(todayStart, -6);
  const rowsDesc = await fetchWeatherRows({
    limit: 1000,
    sinceIso: oldestDayStart.toISOString(),
  });

  const selectedDayId = toDayKey(todayStart);

  const dayStarts = Array.from({ length: 7 }, (_, index) => addLocalDays(oldestDayStart, index));
  const trendsByDayId: HistoryData['trendsByDayId'] = {};

  dayStarts.forEach((dayStart) => {
    const dayKey = toDayKey(dayStart);
    const rowsForDay = filterRowsForDay(rowsDesc, dayStart);

    trendsByDayId[dayKey] = {
      temperatureTrendPoints: buildHourlyTrendPoints(rowsForDay, 23, 'temperature', false),
      humidityTrendPoints: buildHourlyTrendPoints(rowsForDay, 23, 'humidity', false),
    };
  });

  const dayChips = dayStarts.map((dayStart) => toDayChip(dayStart, selectedDayId));

  const records = [1, 2, 3].map((dayOffset) => {
    const dayStart = addLocalDays(todayStart, -dayOffset);
    const rowsForDay = filterRowsForDay(rowsDesc, dayStart);
    return buildDailyRecord(dayStart, rowsForDay);
  });

  const selectedDayTrends = trendsByDayId[selectedDayId];
  const latestTrend = selectedDayTrends?.temperatureTrendPoints[selectedDayTrends.temperatureTrendPoints.length - 1];

  if (!rowsDesc.length) {
    return {
      ...MOCK_HISTORY,
      dayChips,
      selectedDayId,
      trendsByDayId,
      records,
      monthLabel: formatMonthLabel(todayStart),
    };
  }

  return {
    monthLabel: formatMonthLabel(todayStart),
    dayChips,
    selectedDayId,
    activeMetric: 'temperature',
    trendsByDayId,
    tooltipLabel: latestTrend?.label ?? MOCK_HISTORY.tooltipLabel,
    tooltipValue: latestTrend ? `${latestTrend.value} C` : MOCK_HISTORY.tooltipValue,
    records,
  };
}

export async function fetchSettingsTemplate(): Promise<SettingsData> {
  // TODO(DB_CLIENT): Create a dedicated settings table when needed.
  // For now this remains static because your current schema has one readings table only.
  return Promise.resolve(MOCK_SETTINGS);
}
