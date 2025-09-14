# Cấu trúc thư mục dự án Xanh Argi

Dự án đã được tổ chức lại theo best practices của React Native với cấu trúc thư mục rõ ràng và dễ bảo trì.

## 📁 Cấu trúc thư mục

```
src/
├── assets/          # Tài nguyên tĩnh (hình ảnh, icon, fonts)
├── components/      # Các component tái sử dụng
├── hooks/          # Custom hooks
├── screens/        # Các màn hình chính của ứng dụng
├── services/       # Logic giao tiếp với API và services bên ngoài
├── store/          # State management (Zustand stores)
├── types/          # TypeScript type definitions
├── utils/          # Utility functions và helpers
├── App.tsx         # Component chính của ứng dụng
└── QueryProvider.tsx # React Query provider
```

## 📋 Mô tả chi tiết

### `/assets`
Chứa tất cả tài nguyên tĩnh như:
- Hình ảnh (PNG, JPG, SVG)
- Icons
- Fonts
- Splash screens

### `/components`
Các component UI có thể tái sử dụng trong nhiều màn hình khác nhau:
- Button components
- Input components
- Card components
- Loading components

### `/hooks`
Custom React hooks để tái sử dụng logic:
- useLocation
- useWeather
- useStorage

### `/screens`
Các màn hình chính của ứng dụng:
- WeatherScreen.tsx - Màn hình thời tiết chính
- SettingsScreen.tsx - Màn hình cài đặt
- FavoritesScreen.tsx - Màn hình yêu thích

### `/services`
Logic giao tiếp với API và services bên ngoài:
- weatherService.ts - API calls cho thời tiết
- locationService.ts - Xử lý vị trí GPS
- storageService.ts - Local storage operations

### `/store`
Chứa Zustand stores được tổ chức theo từng chức năng riêng biệt:
- `appStore.ts` - Quản lý cài đặt chung của ứng dụng (theme, ngôn ngữ, thông báo)
- `weatherDataStore.ts` - Quản lý dữ liệu thời tiết, thành phố yêu thích, lịch sử tìm kiếm
- `index.ts` - Export tất cả stores và cung cấp custom hooks tiện lợi

### `/types`
TypeScript type definitions:
- API response types
- Component prop types
- Global type definitions

### `/utils`
Các utility functions và helpers:
- logger.ts - Logging utilities
- terminalLogger.ts - Terminal logging cho development
- formatters.ts - Data formatting functions
- constants.ts - App constants

## 🚀 Lợi ích của cấu trúc mới

1. **Tổ chức rõ ràng**: Mỗi loại file có vị trí cụ thể
2. **Dễ bảo trì**: Tìm kiếm và chỉnh sửa code dễ dàng hơn
3. **Scalable**: Dễ dàng mở rộng khi dự án phát triển
4. **Team collaboration**: Các developer dễ hiểu và làm việc cùng nhau
5. **Best practices**: Tuân theo chuẩn của cộng đồng React Native
6. **Store modular**: Stores được chia nhỏ theo chức năng, tránh "God Object"
7. **Performance**: Chỉ re-render khi state liên quan thay đổi
8. **Developer Experience**: Custom hooks giúp code ngắn gọn và dễ đọc

## 🏪 Hướng dẫn sử dụng Store

### Sử dụng App Settings
```typescript
import { useAppSettings, useAppActions } from '../store';

const MyComponent = () => {
  const { theme, temperatureUnit } = useAppSettings();
  const { setTheme, setTemperatureUnit } = useAppActions();
  
  return (
    <View>
      <Text>Current theme: {theme}</Text>
      <Button onPress={() => setTheme('dark')} title="Dark Mode" />
    </View>
  );
};
```

### Sử dụng Weather Data
```typescript
import { useWeatherData, useWeatherActions } from '../store';

const WeatherComponent = () => {
  const { currentWeather, favoriteCities } = useWeatherData();
  const { addFavoriteCity, setCurrentWeather } = useWeatherActions();
  
  return (
    <View>
      <Text>{currentWeather?.temperature}°</Text>
      <Text>Favorite cities: {favoriteCities.length}</Text>
    </View>
  );
};
```

### Sử dụng Specialized Hooks
```typescript
import { useTemperatureSettings, useFavoriteCities } from '../store';

const TemperatureDisplay = () => {
  const { temperatureUnit, formatTemperature } = useTemperatureSettings();
  const { favoriteCities } = useFavoriteCities();
  
  return (
    <View>
      {favoriteCities.map(city => (
        <Text key={city.id}>
          {city.name}: {formatTemperature(city.currentTemp || 0, temperatureUnit)}
        </Text>
      ))}
    </View>
  );
};
```

## 📝 Quy tắc đặt tên

- **Components**: PascalCase (VD: WeatherCard.tsx)
- **Hooks**: camelCase với prefix 'use' (VD: useWeather.ts)
- **Services**: camelCase với suffix 'Service' (VD: weatherService.ts)
- **Stores**: camelCase với suffix 'Store' (VD: weatherStore.ts)
- **Utils**: camelCase (VD: formatDate.ts)
- **Types**: PascalCase cho interfaces (VD: WeatherData)