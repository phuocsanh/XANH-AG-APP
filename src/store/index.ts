// Import các store
import useAppStore from './appStore';
import useWeatherDataStore from './weatherDataStore';

// Export tất cả các store
export { default as useAppStore } from './appStore';
export { default as useWeatherDataStore } from './weatherDataStore';

// Export các types từ appStore
export type {
  TemperatureUnit,
  Theme,
  Language,
  AppStoreState,
} from './appStore';

// Export các utility functions từ appStore
export {
  convertTemperature,
  getTemperatureSymbol,
  formatTemperature,
} from './appStore';

// Export các types từ weatherDataStore
export type {
  FavoriteCity,
  SearchHistoryItem,
  CurrentWeatherData,
  WeatherForecast,
  WeatherDataStoreState,
} from './weatherDataStore';

// Export các utility functions từ weatherDataStore
export {
  getFavoriteCityById,
  getRecentSearches,
  formatLastUpdated,
} from './weatherDataStore';

// Import utility functions để sử dụng trong hooks
import {
  convertTemperature,
  getTemperatureSymbol,
  formatTemperature,
} from './appStore';

import {
  getFavoriteCityById,
  getRecentSearches,
} from './weatherDataStore';

// Hook tổng hợp để lấy cài đặt chung của app
export const useAppSettings = () => {
  const {
    theme,
    language,
    temperatureUnit,
    showNotifications,
    autoRefresh,
    refreshInterval,
    compactMode,
  } = useAppStore();
  
  return {
    theme,
    language,
    temperatureUnit,
    showNotifications,
    autoRefresh,
    refreshInterval,
    compactMode,
  };
};

// Hook tổng hợp để lấy actions của app
export const useAppActions = () => {
  const {
    setTheme,
    setLanguage,
    setTemperatureUnit,
    setShowNotifications,
    setAutoRefresh,
    setRefreshInterval,
    setCompactMode,
    resetAppSettings,
  } = useAppStore();
  
  return {
    setTheme,
    setLanguage,
    setTemperatureUnit,
    setShowNotifications,
    setAutoRefresh,
    setRefreshInterval,
    setCompactMode,
    resetAppSettings,
  };
};

// Hook tổng hợp để lấy dữ liệu thời tiết
export const useWeatherData = () => {
  const {
    currentWeather,
    weatherForecast,
    favoriteCities,
    searchHistory,
    isLoading,
    error,
  } = useWeatherDataStore();
  
  return {
    currentWeather,
    weatherForecast,
    favoriteCities,
    searchHistory,
    isLoading,
    error,
  };
};

// Hook tổng hợp để lấy actions của weather data
export const useWeatherActions = () => {
  const {
    setCurrentWeather,
    setWeatherForecast,
    clearWeatherData,
    addFavoriteCity,
    removeFavoriteCity,
    updateFavoriteCityWeather,
    clearFavoriteCities,
    addToSearchHistory,
    removeFromSearchHistory,
    clearSearchHistory,
    setLoading,
    setError,
    resetWeatherStore,
  } = useWeatherDataStore();
  
  return {
    setCurrentWeather,
    setWeatherForecast,
    clearWeatherData,
    addFavoriteCity,
    removeFavoriteCity,
    updateFavoriteCityWeather,
    clearFavoriteCities,
    addToSearchHistory,
    removeFromSearchHistory,
    clearSearchHistory,
    setLoading,
    setError,
    resetWeatherStore,
  };
};

// Hook tổng hợp để lấy cả settings và actions liên quan đến temperature
export const useTemperatureSettings = () => {
  const { temperatureUnit } = useAppStore();
  const { setTemperatureUnit } = useAppStore();
  
  return {
    temperatureUnit,
    setTemperatureUnit,
    convertTemperature,
    getTemperatureSymbol,
    formatTemperature,
  };
};

// Hook để lấy theme và actions liên quan
export const useThemeSettings = () => {
  const { theme, compactMode } = useAppStore();
  const { setTheme, setCompactMode } = useAppStore();
  
  return {
    theme,
    compactMode,
    setTheme,
    setCompactMode,
  };
};

// Hook để quản lý thành phố yêu thích
export const useFavoriteCities = () => {
  const { favoriteCities } = useWeatherDataStore();
  const {
    addFavoriteCity,
    removeFavoriteCity,
    updateFavoriteCityWeather,
    clearFavoriteCities,
  } = useWeatherDataStore();
  
  return {
    favoriteCities,
    addFavoriteCity,
    removeFavoriteCity,
    updateFavoriteCityWeather,
    clearFavoriteCities,
    getFavoriteCityById: (id: string) => getFavoriteCityById(favoriteCities, id),
  };
};

// Hook để quản lý lịch sử tìm kiếm
export const useSearchHistory = () => {
  const { searchHistory } = useWeatherDataStore();
  const {
    addToSearchHistory,
    removeFromSearchHistory,
    clearSearchHistory,
  } = useWeatherDataStore();
  
  return {
    searchHistory,
    addToSearchHistory,
    removeFromSearchHistory,
    clearSearchHistory,
    getRecentSearches: (limit?: number) => getRecentSearches(searchHistory, limit),
  };
};