import { supabase } from '@/lib/supabase';

export type WeatherTrendPoint = {
  label: string;
  value: number;
};

export type WeatherInsertEvent = {
  createdAt: string;
  temperature: number;
  humidity: number;
};

export type CurrentWeatherData = {
  locationLabel: string;
  temperatureValue: number;
  temperatureUnit: 'C' | 'F';
  humidityPercent: number;
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
  activeMetric: 'temperature' | 'humidity';
  trendPoints: WeatherTrendPoint[];
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
  activeMetric: 'temperature',
  trendPoints: [
    { label: 'Oct 18', value: 20 },
    { label: 'Oct 19', value: 22 },
    { label: 'Oct 20', value: 21 },
    { label: 'Oct 21', value: 24 },
    { label: 'Oct 22', value: 26 },
  ],
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

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}

function toSafeNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseDate(value: string): Date {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return new Date();
  }
  return parsedDate;
}

function formatClockLabel(dateValue: string): string {
  const date = parseDate(dateValue);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  if (hours === 0 && minutes === 0) {
    return '12 AM';
  }
  if (hours === 12 && minutes === 0) {
    return '12 PM';
  }
  if (minutes === 0) {
    if (hours === 0) {
      return '12 AM';
    }
    if (hours < 12) {
      return `${hours} AM`;
    }
    return `${hours - 12} PM`;
  }
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function formatWeekday(dateValue: string): string {
  return parseDate(dateValue).toLocaleDateString('en-US', { weekday: 'short' });
}

function formatMonthLabel(dateValue: string): string {
  return parseDate(dateValue).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatRecordDate(dateValue: string): string {
  return parseDate(dateValue).toLocaleDateString('en-US', {
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

function buildTrendPoints(rowsAsc: WeatherReadingRow[], maxPoints: number): WeatherTrendPoint[] {
  const selectedRows = rowsAsc.slice(-maxPoints);
  return selectedRows.map((row, index) => ({
    label: index === selectedRows.length - 1 ? 'Now' : formatClockLabel(row.createdAt),
    value: roundOne(row.temperature),
  }));
}

async function fetchWeatherRows(limit: number): Promise<WeatherReadingRow[]> {
  const tableName = WEATHER_DB_TEMPLATE.tables.weatherReadings;
  const fields = WEATHER_DB_TEMPLATE.fields.weatherReadings;

  // TODO(DB_TABLE): Change tableName if your weather table has a different name.
  // TODO(DB_FIELDS): Change fields.createdAt / fields.temperature / fields.humidity to match your schema.
  const { data, error } = await supabase
    .from(tableName)
    .select(`${fields.createdAt},${fields.temperature},${fields.humidity}`)
    .order(fields.createdAt, { ascending: false })
    .limit(limit);

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
  const rowsDesc = await fetchWeatherRows(24);

  if (!rowsDesc.length) {
    return MOCK_CURRENT_WEATHER;
  }

  const latest = rowsDesc[0];
  const previous = rowsDesc[1] ?? latest;
  const rowsAsc = [...rowsDesc].reverse();
  const trendPoints = buildTrendPoints(rowsAsc, 5);
  const deltaValue = roundOne(latest.temperature - previous.temperature);
  const deltaPrefix = deltaValue >= 0 ? '+' : '';

  return {
    ...MOCK_CURRENT_WEATHER,
    temperatureValue: roundOne(latest.temperature),
    humidityPercent: Math.round(latest.humidity),
    trendDeltaLabel: `${deltaPrefix}${deltaValue} from previous`,
    trendPoints: trendPoints.length ? trendPoints : MOCK_CURRENT_WEATHER.trendPoints,
    // Placeholders until you wire an external weather API for these metrics.
    pressureValue: MOCK_CURRENT_WEATHER.pressureValue,
    windSpeedValue: MOCK_CURRENT_WEATHER.windSpeedValue,
    windDirection: MOCK_CURRENT_WEATHER.windDirection,
    uvIndexValue: MOCK_CURRENT_WEATHER.uvIndexValue,
    uvIndexLabel: MOCK_CURRENT_WEATHER.uvIndexLabel,
  };
}

export async function fetchHistoryTemplate(): Promise<HistoryData> {
  const rowsDesc = await fetchWeatherRows(96);

  if (!rowsDesc.length) {
    return MOCK_HISTORY;
  }

  const rowsAsc = [...rowsDesc].reverse();
  const trendPoints = buildTrendPoints(rowsAsc, 7);
  const latest = rowsDesc[0];

  const dayChipRows = rowsDesc.slice(0, 7).reverse();
  const dayChips: HistoryDayChip[] = dayChipRows.map((row, index) => {
    const rowDate = parseDate(row.createdAt);
    const isSelected = index === dayChipRows.length - 1;

    return {
      id: `${row.createdAt}-${index}`,
      weekdayLabel: formatWeekday(row.createdAt),
      dayOfMonth: rowDate.getDate(),
      state: isSelected ? 'selected' : 'range',
    };
  });

  const records: HistoryRecord[] = rowsDesc.slice(0, 3).map((row, index) => ({
    id: `${row.createdAt}-${index}`,
    dateLabel: formatRecordDate(row.createdAt),
    summaryLabel: humiditySummary(row.humidity),
    highTemp: Math.round(row.temperature),
    lowTemp: Math.round(row.temperature),
    humidityPercent: Math.round(row.humidity),
    iconName: iconFromHumidity(row.humidity),
  }));

  const latestTrend = trendPoints[trendPoints.length - 1];

  return {
    monthLabel: formatMonthLabel(latest.createdAt),
    dayChips: dayChips.length ? dayChips : MOCK_HISTORY.dayChips,
    activeMetric: 'temperature',
    trendPoints: trendPoints.length ? trendPoints : MOCK_HISTORY.trendPoints,
    tooltipLabel: latestTrend?.label ?? MOCK_HISTORY.tooltipLabel,
    tooltipValue: latestTrend ? `${latestTrend.value} C` : MOCK_HISTORY.tooltipValue,
    records: records.length ? records : MOCK_HISTORY.records,
  };
}

export async function fetchSettingsTemplate(): Promise<SettingsData> {
  // TODO(DB_CLIENT): Create a dedicated settings table when needed.
  // For now this remains static because your current schema has one readings table only.
  return Promise.resolve(MOCK_SETTINGS);
}
