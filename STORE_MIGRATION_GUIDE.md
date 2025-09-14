# 🔄 Hướng dẫn Migration Store

## Tổng quan

Dự án đã được tái cấu trúc từ một store duy nhất `weatherStore.ts` thành nhiều store nhỏ theo chức năng:

- **`appStore.ts`**: Quản lý cài đặt chung của ứng dụng
- **`weatherDataStore.ts`**: Quản lý dữ liệu thời tiết và user data
- **`index.ts`**: Cung cấp custom hooks tiện lợi

## 📋 Bảng so sánh Migration

### Store cũ vs Store mới

| Store cũ (weatherStore.ts) | Store mới | Ghi chú |
|----------------------------|-----------|----------|
| `theme` | `appStore.theme` | Chuyển sang app settings |
| `temperatureUnit` | `appStore.temperatureUnit` | Chuyển sang app settings |
| `favoriteCities` | `weatherDataStore.favoriteCities` | Giữ nguyên logic |
| `searchHistory` | `weatherDataStore.searchHistory` | Giữ nguyên logic |
| `autoRefresh` | `appStore.autoRefresh` | Chuyển sang app settings |
| `refreshInterval` | `appStore.refreshInterval` | Chuyển sang app settings |
| `showNotifications` | `appStore.showNotifications` | Chuyển sang app settings |

### Hooks cũ vs Hooks mới

| Cách cũ | Cách mới | Lợi ích |
|---------|----------|----------|
| `useWeatherStore()` | `useAppSettings()`, `useWeatherData()` | Tách biệt concerns |
| `const { theme, temperatureUnit } = useWeatherStore()` | `const { theme } = useAppSettings(); const { temperatureUnit } = useTemperatureSettings()` | Chỉ re-render khi cần |
| `const { favoriteCities, addFavoriteCity } = useWeatherStore()` | `const { favoriteCities, addFavoriteCity } = useFavoriteCities()` | Semantic và focused |

## 🔧 Cách Migration Code

### 1. Import statements

**Cũ:**
```typescript
import useWeatherStore from '../store/weatherStore';
```

**Mới:**
```typescript
import { 
  useAppSettings, 
  useTemperatureSettings, 
  useFavoriteCities, 
  useSearchHistory 
} from '../store';
```

### 2. Component usage

**Cũ:**
```typescript
const MyComponent = () => {
  const {
    theme,
    temperatureUnit,
    favoriteCities,
    addFavoriteCity,
    setTheme,
    setTemperatureUnit
  } = useWeatherStore();
  
  return (
    <View>
      <Text>Theme: {theme}</Text>
      <Text>Unit: {temperatureUnit}</Text>
      <Text>Cities: {favoriteCities.length}</Text>
    </View>
  );
};
```

**Mới:**
```typescript
const MyComponent = () => {
  const { theme } = useAppSettings();
  const { temperatureUnit, setTemperatureUnit } = useTemperatureSettings();
  const { favoriteCities, addFavoriteCity } = useFavoriteCities();
  const { setTheme } = useAppActions();
  
  return (
    <View>
      <Text>Theme: {theme}</Text>
      <Text>Unit: {temperatureUnit}</Text>
      <Text>Cities: {favoriteCities.length}</Text>
    </View>
  );
};
```

### 3. Utility functions

**Cũ:**
```typescript
import { convertTemperature, getTemperatureSymbol } from '../store/weatherStore';
```

**Mới:**
```typescript
import { convertTemperature, getTemperatureSymbol, formatTemperature } from '../store';
// Hoặc sử dụng hook
const { formatTemperature } = useTemperatureSettings();
```

## 🎯 Lợi ích của Store mới

### 1. **Performance tốt hơn**
- Components chỉ re-render khi state liên quan thay đổi
- Tránh unnecessary re-renders

### 2. **Code dễ đọc hơn**
- Mỗi hook có mục đích rõ ràng
- Import statements ngắn gọn

### 3. **Maintainability**
- Dễ dàng thêm/sửa/xóa features
- Code được tổ chức theo domain

### 4. **Type Safety**
- TypeScript types được tách biệt rõ ràng
- IntelliSense tốt hơn

### 5. **Testing**
- Dễ dàng mock từng store riêng biệt
- Unit test focused hơn

## 🚀 Các tính năng mới

### 1. **Specialized Hooks**
```typescript
// Hook chuyên biệt cho temperature
const { temperatureUnit, formatTemperature } = useTemperatureSettings();

// Hook chuyên biệt cho theme
const { theme, compactMode, setTheme } = useThemeSettings();

// Hook chuyên biệt cho favorite cities
const { favoriteCities, getFavoriteCityById } = useFavoriteCities();
```

### 2. **Enhanced App Settings**
```typescript
// Thêm nhiều cài đặt mới
const {
  language,           // Ngôn ngữ
  soundEnabled,       // Âm thanh
  vibrationEnabled,   // Rung
  compactMode,        // Chế độ compact
  showSplashScreen    // Màn hình chào
} = useAppSettings();
```

### 3. **Better Weather Data Management**
```typescript
// Quản lý state loading/error tốt hơn
const {
  currentWeather,
  weatherForecast,
  isLoading,
  error
} = useWeatherData();

// Actions tách biệt
const {
  setCurrentWeather,
  setLoading,
  setError
} = useWeatherActions();
```

## 📝 Checklist Migration

- [ ] Cập nhật import statements
- [ ] Thay thế `useWeatherStore()` bằng specialized hooks
- [ ] Test tất cả components sử dụng store
- [ ] Kiểm tra TypeScript errors
- [ ] Test performance (không có unnecessary re-renders)
- [ ] Cập nhật documentation
- [ ] Xóa file `weatherStore.ts` cũ (đã hoàn thành)

## 🔍 Troubleshooting

### Lỗi thường gặp:

1. **"Cannot find name 'useWeatherStore'"**
   - Cập nhật import statement
   - Sử dụng specialized hooks thay thế

2. **"Property does not exist on type"**
   - Kiểm tra property đã được move sang store nào
   - Sử dụng đúng hook tương ứng

3. **Unnecessary re-renders**
   - Sử dụng hook chuyên biệt thay vì hook tổng quát
   - Ví dụ: `useTemperatureSettings()` thay vì `useAppSettings()`

## 🎉 Kết luận

Việc migration này giúp:
- Code dễ maintain và scale hơn
- Performance tốt hơn
- Developer experience tốt hơn
- Chuẩn bị tốt cho việc thêm features mới

Nếu có thắc mắc, tham khảo file `src/store/index.ts` để xem tất cả hooks available.