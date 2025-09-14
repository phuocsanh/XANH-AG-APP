import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Interface cho thành phố yêu thích
export interface FavoriteCity {
  id: string;
  name: string;
  country: string;
  lat?: number;
  lon?: number;
  addedAt: number;
  lastWeatherUpdate?: number;
  currentTemp?: number;
  weatherCondition?: string;
}

// Interface cho lịch sử tìm kiếm
export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
  resultCount?: number;
}

// Interface cho dữ liệu thời tiết hiện tại
export interface CurrentWeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  pressure: number;
  visibility: number;
  uvIndex: number;
  lastUpdated: number;
}

// Interface cho dự báo thời tiết
export interface WeatherForecast {
  date: string;
  maxTemp: number;
  minTemp: number;
  condition: string;
  humidity: number;
  chanceOfRain: number;
}

// Interface cho store dữ liệu thời tiết
export interface WeatherDataStoreState {
  // Dữ liệu thời tiết hiện tại
  currentWeather: CurrentWeatherData | null;
  weatherForecast: WeatherForecast[];
  
  // Quản lý thành phố yêu thích
  favoriteCities: FavoriteCity[];
  
  // Lịch sử tìm kiếm
  searchHistory: SearchHistoryItem[];
  
  // Trạng thái loading và error
  isLoading: boolean;
  error: string | null;
  
  // Actions cho dữ liệu thời tiết
  setCurrentWeather: (weather: CurrentWeatherData) => void;
  setWeatherForecast: (forecast: WeatherForecast[]) => void;
  clearWeatherData: () => void;
  
  // Actions cho thành phố yêu thích
  addFavoriteCity: (city: Omit<FavoriteCity, 'id' | 'addedAt'>) => void;
  removeFavoriteCity: (cityId: string) => void;
  updateFavoriteCityWeather: (cityId: string, weather: Partial<FavoriteCity>) => void;
  clearFavoriteCities: () => void;
  
  // Actions cho lịch sử tìm kiếm
  addToSearchHistory: (query: string, resultCount?: number) => void;
  removeFromSearchHistory: (itemId: string) => void;
  clearSearchHistory: () => void;
  
  // Actions cho trạng thái
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Utility actions
  resetWeatherStore: () => void;
}

// Trạng thái khởi tạo
const initialWeatherState = {
  currentWeather: null,
  weatherForecast: [] as WeatherForecast[],
  favoriteCities: [] as FavoriteCity[],
  searchHistory: [] as SearchHistoryItem[],
  isLoading: false,
  error: null,
};

// Store cho dữ liệu thời tiết
const useWeatherDataStore = create<WeatherDataStoreState>()(
  persist(
    (set, get) => ({
      ...initialWeatherState,
      
      // Actions cho dữ liệu thời tiết
      setCurrentWeather: (weather: CurrentWeatherData) => {
        console.log('🌤️ Cập nhật thời tiết hiện tại:', weather.location);
        set({ currentWeather: weather, error: null });
      },
      
      setWeatherForecast: (forecast: WeatherForecast[]) => {
        console.log('📅 Cập nhật dự báo thời tiết:', forecast.length, 'ngày');
        set({ weatherForecast: forecast });
      },
      
      clearWeatherData: () => {
        console.log('🗑️ Xóa dữ liệu thời tiết');
        set({ currentWeather: null, weatherForecast: [], error: null });
      },
      
      // Actions cho thành phố yêu thích
      addFavoriteCity: (city: Omit<FavoriteCity, 'id' | 'addedAt'>) => {
        const { favoriteCities } = get();
        
        // Kiểm tra xem thành phố đã tồn tại chưa
        const existingCity = favoriteCities.find(
          (c) => c.name.toLowerCase() === city.name.toLowerCase() && 
                 c.country.toLowerCase() === city.country.toLowerCase()
        );
        
        if (existingCity) {
          console.log('⚠️ Thành phố đã có trong danh sách yêu thích:', city.name);
          return;
        }
        
        const newCity: FavoriteCity = {
          ...city,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          addedAt: Date.now(),
        };
        
        console.log('⭐ Thêm thành phố yêu thích:', newCity.name);
        set({ favoriteCities: [...favoriteCities, newCity] });
      },
      
      removeFavoriteCity: (cityId: string) => {
        const { favoriteCities } = get();
        const cityToRemove = favoriteCities.find(c => c.id === cityId);
        
        console.log('🗑️ Xóa thành phố yêu thích:', cityToRemove?.name);
        set({ 
          favoriteCities: favoriteCities.filter((city) => city.id !== cityId) 
        });
      },
      
      updateFavoriteCityWeather: (cityId: string, weather: Partial<FavoriteCity>) => {
        const { favoriteCities } = get();
        const updatedCities = favoriteCities.map((city) => 
          city.id === cityId 
            ? { ...city, ...weather, lastWeatherUpdate: Date.now() }
            : city
        );
        
        console.log('🔄 Cập nhật thời tiết cho thành phố yêu thích:', cityId);
        set({ favoriteCities: updatedCities });
      },
      
      clearFavoriteCities: () => {
        console.log('🗑️ Xóa tất cả thành phố yêu thích');
        set({ favoriteCities: [] });
      },
      
      // Actions cho lịch sử tìm kiếm
      addToSearchHistory: (query: string, resultCount?: number) => {
        const { searchHistory } = get();
        const trimmedQuery = query.trim();
        
        if (!trimmedQuery) return;
        
        // Xóa query cũ nếu đã tồn tại
        const filteredHistory = searchHistory.filter(
          (item) => item.query.toLowerCase() !== trimmedQuery.toLowerCase()
        );
        
        const newItem: SearchHistoryItem = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          query: trimmedQuery,
          timestamp: Date.now(),
          resultCount,
        };
        
        // Giữ tối đa 20 item trong lịch sử
        const updatedHistory = [newItem, ...filteredHistory].slice(0, 20);
        
        console.log('🔍 Thêm vào lịch sử tìm kiếm:', trimmedQuery);
        set({ searchHistory: updatedHistory });
      },
      
      removeFromSearchHistory: (itemId: string) => {
        const { searchHistory } = get();
        const itemToRemove = searchHistory.find(item => item.id === itemId);
        
        console.log('🗑️ Xóa khỏi lịch sử tìm kiếm:', itemToRemove?.query);
        set({ 
          searchHistory: searchHistory.filter((item) => item.id !== itemId) 
        });
      },
      
      clearSearchHistory: () => {
        console.log('🗑️ Xóa tất cả lịch sử tìm kiếm');
        set({ searchHistory: [] });
      },
      
      // Actions cho trạng thái
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
      
      setError: (error: string | null) => {
        console.log(error ? '❌ Lỗi:' : '✅ Xóa lỗi:', error);
        set({ error, isLoading: false });
      },
      
      // Reset toàn bộ store
      resetWeatherStore: () => {
        console.log('🔄 Reset store dữ liệu thời tiết');
        set(initialWeatherState);
      },
    }),
    {
      name: 'weather-data-store', // Tên key trong AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
      // Chỉ lưu những field cần thiết (không lưu currentWeather và isLoading)
      partialize: (state: WeatherDataStoreState) => ({
        favoriteCities: state.favoriteCities,
        searchHistory: state.searchHistory,
        // Không lưu currentWeather, weatherForecast, isLoading, error
        // vì chúng sẽ được load lại khi app khởi động
      }),
    }
  )
);

export default useWeatherDataStore;

// Utility functions
export const getFavoriteCityById = (cities: FavoriteCity[], id: string): FavoriteCity | undefined => {
  return cities.find(city => city.id === id);
};

export const getRecentSearches = (history: SearchHistoryItem[], limit: number = 5): SearchHistoryItem[] => {
  return history
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
};

export const formatLastUpdated = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
};