import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Định nghĩa các types chung cho ứng dụng
export type TemperatureUnit = 'celsius' | 'fahrenheit';
export type Theme = 'light' | 'dark' | 'auto';
export type Language = 'vi' | 'en';

// Interface cho cài đặt ứng dụng chung
export interface AppStoreState {
  // Cài đặt giao diện
  theme: Theme;
  language: Language;
  temperatureUnit: TemperatureUnit;
  
  // Cài đặt thông báo
  showNotifications: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  
  // Cài đặt tự động
  autoRefresh: boolean;
  refreshInterval: number; // tính bằng phút
  
  // Cài đặt hiển thị
  showSplashScreen: boolean;
  compactMode: boolean;
  
  // Actions cho theme và ngôn ngữ
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  setTemperatureUnit: (unit: TemperatureUnit) => void;
  
  // Actions cho thông báo
  setShowNotifications: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setVibrationEnabled: (enabled: boolean) => void;
  
  // Actions cho tự động hóa
  setAutoRefresh: (enabled: boolean) => void;
  setRefreshInterval: (minutes: number) => void;
  
  // Actions cho hiển thị
  setShowSplashScreen: (enabled: boolean) => void;
  setCompactMode: (enabled: boolean) => void;
  
  // Utility actions
  resetAppSettings: () => void;
}

// Trạng thái khởi tạo cho app
const initialAppState = {
  theme: 'auto' as Theme,
  language: 'vi' as Language,
  temperatureUnit: 'celsius' as TemperatureUnit,
  showNotifications: true,
  soundEnabled: true,
  vibrationEnabled: true,
  autoRefresh: true,
  refreshInterval: 30, // 30 phút
  showSplashScreen: true,
  compactMode: false,
};

// Store chính cho cài đặt ứng dụng
const useAppStore = create<AppStoreState>()(
  persist(
    (set, get) => ({
      ...initialAppState,
      
      // Actions cho theme và ngôn ngữ
      setTheme: (theme: Theme) => {
        console.log('🎨 Thay đổi theme:', theme);
        set({ theme });
      },
      
      setLanguage: (language: Language) => {
        console.log('🌐 Thay đổi ngôn ngữ:', language);
        set({ language });
      },
      
      setTemperatureUnit: (unit: TemperatureUnit) => {
        console.log('🌡️ Thay đổi đơn vị nhiệt độ:', unit);
        set({ temperatureUnit: unit });
      },
      
      // Actions cho thông báo
      setShowNotifications: (enabled: boolean) => {
        console.log('🔔 Cài đặt thông báo:', enabled);
        set({ showNotifications: enabled });
      },
      
      setSoundEnabled: (enabled: boolean) => {
        console.log('🔊 Cài đặt âm thanh:', enabled);
        set({ soundEnabled: enabled });
      },
      
      setVibrationEnabled: (enabled: boolean) => {
        console.log('📳 Cài đặt rung:', enabled);
        set({ vibrationEnabled: enabled });
      },
      
      // Actions cho tự động hóa
      setAutoRefresh: (enabled: boolean) => {
        console.log('🔄 Cài đặt tự động làm mới:', enabled);
        set({ autoRefresh: enabled });
      },
      
      setRefreshInterval: (minutes: number) => {
        console.log('⏱️ Cài đặt khoảng thời gian làm mới:', minutes, 'phút');
        set({ refreshInterval: minutes });
      },
      
      // Actions cho hiển thị
      setShowSplashScreen: (enabled: boolean) => {
        console.log('🚀 Cài đặt màn hình chào:', enabled);
        set({ showSplashScreen: enabled });
      },
      
      setCompactMode: (enabled: boolean) => {
        console.log('📱 Cài đặt chế độ compact:', enabled);
        set({ compactMode: enabled });
      },
      
      // Reset tất cả cài đặt về mặc định
      resetAppSettings: () => {
        console.log('🔄 Reset tất cả cài đặt ứng dụng');
        set(initialAppState);
      },
    }),
    {
      name: 'app-store', // Tên key trong AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
      // Chỉ lưu những field cần thiết
      partialize: (state: AppStoreState) => ({
        theme: state.theme,
        language: state.language,
        temperatureUnit: state.temperatureUnit,
        showNotifications: state.showNotifications,
        soundEnabled: state.soundEnabled,
        vibrationEnabled: state.vibrationEnabled,
        autoRefresh: state.autoRefresh,
        refreshInterval: state.refreshInterval,
        showSplashScreen: state.showSplashScreen,
        compactMode: state.compactMode,
      }),
    }
  )
);

export default useAppStore;

// Utility functions cho temperature conversion
export const convertTemperature = (temp: number, unit: TemperatureUnit): number => {
  if (unit === 'fahrenheit') {
    return (temp * 9/5) + 32;
  }
  return temp; // celsius
};

// Lấy ký hiệu nhiệt độ
export const getTemperatureSymbol = (unit: TemperatureUnit): string => {
  return unit === 'celsius' ? '°C' : '°F';
};

// Format nhiệt độ với đơn vị
export const formatTemperature = (temp: number, unit: TemperatureUnit): string => {
  const convertedTemp = convertTemperature(temp, unit);
  const symbol = getTemperatureSymbol(unit);
  return `${Math.round(convertedTemp)}${symbol}`;
};