import axios from 'axios';
import { OPENWEATHER_API_KEY, OPENWEATHER_BASE_URL } from '@env';
import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { terminalApiLogger } from '../utils/terminalLogger';

// Type definitions for OpenWeatherMap API
export interface WeatherData {
  coord: {
    lon: number;
    lat: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  base: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
    sea_level?: number;
    grnd_level?: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  clouds: {
    all: number;
  };
  dt: number;
  sys: {
    type?: number;
    id?: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

export interface ForecastItem {
  dt: number;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    sea_level: number;
    grnd_level: number;
    humidity: number;
    temp_kf: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  clouds: {
    all: number;
  };
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  visibility: number;
  pop: number;
  rain?: {
    '3h': number;
  };
  snow?: {
    '3h': number;
  };
  sys: {
    pod: string;
  };
  dt_txt: string;
}

export interface ForecastData {
  cod: string;
  message: number;
  cnt: number;
  list: ForecastItem[];
  city: {
    id: number;
    name: string;
    coord: {
      lat: number;
      lon: number;
    };
    country: string;
    population: number;
    timezone: number;
    sunrise: number;
    sunset: number;
  };
}

// Base API functions
const weatherApi = axios.create({
  baseURL: OPENWEATHER_BASE_URL,
  params: {
    appid: OPENWEATHER_API_KEY,
    units: 'metric',
  },
});

// Request interceptor
weatherApi.interceptors.request.use(
  (config) => {
    terminalApiLogger.request(
      config.method?.toUpperCase() || 'GET',
      `${config.baseURL}${config.url}`,
      config.params
    );
    return config;
  },
  (error) => {
    terminalApiLogger.error(error, error.config?.url);
    return Promise.reject(error);
  }
);

// Response interceptor
weatherApi.interceptors.response.use(
  (response) => {
    terminalApiLogger.response(
      response.status,
      response.config.url || 'unknown',
      response.data
    );
    return response;
  },
  (error) => {
    terminalApiLogger.error(error, error.config?.url);
    return Promise.reject(error);
  }
);

// API functions
export const getCurrentWeatherByCity = async (city: string): Promise<WeatherData> => {
  const response = await weatherApi.get<WeatherData>('/weather', {
    params: { q: city },
  });
  return response.data;
};

export const getWeatherForecastByCity = async (city: string): Promise<ForecastData> => {
  const response = await weatherApi.get<ForecastData>('/forecast', {
    params: { q: city },
  });
  return response.data;
};

export const getCurrentWeatherByCoordinates = async (lat: number, lon: number): Promise<WeatherData> => {
  const response = await weatherApi.get<WeatherData>('/weather', {
    params: { lat, lon },
  });
  return response.data;
};

export const getWeatherForecastByCoordinates = async (lat: number, lon: number): Promise<ForecastData> => {
  const response = await weatherApi.get<ForecastData>('/forecast', {
    params: { lat, lon },
  });
  return response.data;
};

// TanStack Query hooks
export const useCurrentWeather = (
  city: string,
  options?: Omit<UseQueryOptions<WeatherData, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['weather', 'current', city],
    queryFn: () => getCurrentWeatherByCity(city),
    enabled: !!city,
    staleTime: 5 * 60 * 1000, // 5 phút
    gcTime: 10 * 60 * 1000, // 10 phút
    ...options,
  });
};

export const useWeatherForecast = (
  city: string,
  options?: Omit<UseQueryOptions<ForecastData, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['weather', 'forecast', city],
    queryFn: () => getWeatherForecastByCity(city),
    enabled: !!city,
    staleTime: 10 * 60 * 1000, // 10 phút
    gcTime: 30 * 60 * 1000, // 30 phút
    ...options,
  });
};

export const useCurrentWeatherByCoords = (
  lat: number,
  lon: number,
  options?: Omit<UseQueryOptions<WeatherData, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['weather', 'current', 'coords', lat, lon],
    queryFn: () => getCurrentWeatherByCoordinates(lat, lon),
    enabled: !!(lat && lon),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });
};

export const useWeatherForecastByCoords = (
  lat: number,
  lon: number,
  options?: Omit<UseQueryOptions<ForecastData, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['weather', 'forecast', 'coords', lat, lon],
    queryFn: () => getWeatherForecastByCoordinates(lat, lon),
    enabled: !!(lat && lon),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    ...options,
  });
};

// Mutation for refreshing weather data
export const useRefreshWeather = (
  options?: UseMutationOptions<void, Error, { city: string }>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ city }: { city: string }) => {
      // Invalidate and refetch weather queries
      await queryClient.invalidateQueries({
        queryKey: ['weather', 'current', city],
      });
      await queryClient.invalidateQueries({
        queryKey: ['weather', 'forecast', city],
      });
    },
    onSuccess: () => {
      console.log('Dữ liệu thời tiết đã được làm mới thành công');
    },
    onError: (error: Error) => {
      console.error('Lỗi khi làm mới dữ liệu thời tiết:', error);
    },
    ...options,
  });
};

// Utility function for prefetching weather data
export const usePrefetchWeather = () => {
  const queryClient = useQueryClient();
  
  const prefetchCurrentWeather = async (city: string) => {
    await queryClient.prefetchQuery({
      queryKey: ['weather', 'current', city],
      queryFn: () => getCurrentWeatherByCity(city),
      staleTime: 5 * 60 * 1000,
    });
  };
  
  const prefetchWeatherForecast = async (city: string) => {
    await queryClient.prefetchQuery({
      queryKey: ['weather', 'forecast', city],
      queryFn: () => getWeatherForecastByCity(city),
      staleTime: 10 * 60 * 1000,
    });
  };
  
  return {
    prefetchCurrentWeather,
    prefetchWeatherForecast,
  };
};