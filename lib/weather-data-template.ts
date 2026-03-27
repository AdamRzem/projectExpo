export type WeatherTrendPoint = {
	label: string;
	value: number;
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
 * Replace these values first when wiring your real backend.
 */
export const WEATHER_DB_TEMPLATE = {
	tables: {
		currentWeather: 'weather_current',
		hourlyWeather: 'weather_hourly',
		dailyWeather: 'weather_daily',
		userSettings: 'user_settings',
	},
	fields: {
		currentWeather: {
			locationLabel: 'station_name',
			temperatureValue: 'temperature_c',
			humidityPercent: 'humidity_percent',
			windSpeedValue: 'wind_speed_kmh',
			windDirection: 'wind_direction',
			uvIndexValue: 'uv_index',
			pressureValue: 'pressure_hpa',
			measuredAt: 'measured_at',
		},
		hourlyWeather: {
			measuredAt: 'measured_at',
			temperatureValue: 'temperature_c',
		},
		dailyWeather: {
			measuredAt: 'measured_at',
			summaryLabel: 'summary',
			highTemp: 'temp_high_c',
			lowTemp: 'temp_low_c',
			humidityPercent: 'humidity_percent',
			iconName: 'icon_name',
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

const MOCK_CURRENT_WEATHER: CurrentWeatherData = {
	locationLabel: 'San Francisco, CA',
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
	trendDeltaLabel: '+2 from yesterday',
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

export async function fetchCurrentWeatherTemplate(): Promise<CurrentWeatherData> {
	// TODO(DB_CLIENT): Replace this mocked return with your data client call.
	// TODO(DB_TABLE): Use WEATHER_DB_TEMPLATE.tables.currentWeather for your table.
	// TODO(DB_FIELDS): Map WEATHER_DB_TEMPLATE.fields.currentWeather to your real columns.
	// Example Supabase shape:
	// const { data, error } = await supabase
	//   .from(WEATHER_DB_TEMPLATE.tables.currentWeather)
	//   .select('station_name,temperature_c,humidity_percent,wind_speed_kmh,wind_direction,uv_index,pressure_hpa')
	//   .order('measured_at', { ascending: false })
	//   .limit(1)
	//   .single();
	// if (error) throw error;
	// return mapCurrentRowToCurrentWeatherData(data);
	return Promise.resolve(MOCK_CURRENT_WEATHER);
}

export async function fetchHistoryTemplate(): Promise<HistoryData> {
	// TODO(DB_CLIENT): Replace this mocked return with your data client call.
	// TODO(DB_TABLE): Use WEATHER_DB_TEMPLATE.tables.dailyWeather and .hourlyWeather.
	// TODO(DB_FIELDS): Update field names using WEATHER_DB_TEMPLATE.fields.dailyWeather.
	// Example Supabase shape:
	// const { data, error } = await supabase
	//   .from(WEATHER_DB_TEMPLATE.tables.dailyWeather)
	//   .select('measured_at,summary,temp_high_c,temp_low_c,humidity_percent,icon_name')
	//   .gte('measured_at', startDate)
	//   .lte('measured_at', endDate)
	//   .order('measured_at', { ascending: false });
	// if (error) throw error;
	// return mapDailyRowsToHistoryData(data);
	return Promise.resolve(MOCK_HISTORY);
}

export async function fetchSettingsTemplate(): Promise<SettingsData> {
	// TODO(DB_CLIENT): Replace this mocked return with your data client call.
	// TODO(DB_TABLE): Use WEATHER_DB_TEMPLATE.tables.userSettings.
	// TODO(DB_FIELDS): Update field names using WEATHER_DB_TEMPLATE.fields.userSettings.
	// Example Supabase shape:
	// const { data, error } = await supabase
	//   .from(WEATHER_DB_TEMPLATE.tables.userSettings)
	//   .select('temperature_unit,wind_speed_unit,pressure_unit,notifications_enabled,dark_mode_enabled')
	//   .eq('user_id', currentUserId)
	//   .single();
	// if (error) throw error;
	// return mapSettingsRow(data);
	return Promise.resolve(MOCK_SETTINGS);
}
