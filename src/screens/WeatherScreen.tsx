import React, { useState, useEffect, JSX } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { useCurrentWeather, useWeatherForecast, useRefreshWeather, useCurrentWeatherByCoords, useWeatherForecastByCoords } from '../services/weatherService';
import { useAppSettings, useTemperatureSettings, useFavoriteCities, useSearchHistory } from '../store';
import { getCurrentLocationWithCity } from '../services/locationService';

const { width } = Dimensions.get('window');

type TabType = 'current' | 'forecast' | 'hourly';

interface ForecastItemData {
  dt: number;
  main: {
    temp: number;
    humidity: number;
  };
  weather: Array<{
    icon: string;
    description: string;
  }>;
  wind?: {
    speed: number;
  };
  pop?: number; // Probability of precipitation (0-1)
}

const WeatherScreen: React.FC = () => {
  const [city, setCity] = useState<string>('Ho Chi Minh City');
  const [searchCity, setSearchCity] = useState<string>('Ho Chi Minh City');
  const [currentCoords, setCurrentCoords] = useState<{lat: number, lon: number} | null>(null);
  
  // Zustand stores
  const { theme } = useAppSettings();
  const { temperatureUnit } = useTemperatureSettings();
  const { favoriteCities, addFavoriteCity } = useFavoriteCities();
  const { addToSearchHistory } = useSearchHistory();
  
  // TanStack Query hooks
  const {
    data: weatherData,
    isLoading: weatherLoading,
    error: weatherError,
    refetch: refetchWeather
  } = useCurrentWeather(searchCity, { enabled: !currentCoords });
  
  const {
    data: forecastData,
    isLoading: forecastLoading,
    error: forecastError
  } = useWeatherForecast(searchCity, { enabled: !currentCoords });
  
  // Hooks for coordinates-based weather
  const {
    data: coordsWeatherData,
    isLoading: coordsWeatherLoading,
    error: coordsWeatherError
  } = useCurrentWeatherByCoords(
    currentCoords?.lat || 0,
    currentCoords?.lon || 0,
    { enabled: !!currentCoords }
  );
  
  const {
    data: coordsForecastData,
    isLoading: coordsForecastLoading,
    error: coordsForecastError
  } = useWeatherForecastByCoords(
    currentCoords?.lat || 0,
    currentCoords?.lon || 0,
    { enabled: !!currentCoords }
  );
  
  const refreshMutation = useRefreshWeather();
  
  // Use coordinates data if available, otherwise use city data
  const finalWeatherData = currentCoords ? coordsWeatherData : weatherData;
  const finalForecastData = currentCoords ? coordsForecastData : forecastData;
  const loading = (currentCoords ? coordsWeatherLoading || coordsForecastLoading : weatherLoading || forecastLoading) || refreshMutation.isPending;
  const error = currentCoords ? (coordsWeatherError || coordsForecastError) : (weatherError || forecastError);
  const [activeTab, setActiveTab] = useState<TabType>('current');

  // Lấy thời tiết mặc định cho Hà Nội khi khởi động
  useEffect(() => {
    console.info('[MÀN_HÌNH_THỜI_TIẾT] Component đã mount, tìm kiếm thời tiết Hà Nội');
    handleSearch('Hanoi');
  }, []);

  // Hàm tìm kiếm thời tiết
  const searchWeather = (): void => {
    if (!city.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên thành phố');
      return;
    }

    const trimmedCity = city.trim();
    console.info(`[MÀN_HÌNH_THỜI_TIẾT] Tìm kiếm thời tiết cho thành phố: ${trimmedCity}`);
    console.info('[MÀN_HÌNH_THỜI_TIẾT] Gọi API thời tiết hiện tại');
    console.info('[MÀN_HÌNH_THỜI_TIẾT] Gọi API dự báo thời tiết');
    
    // Reset coordinates to use city-based search
    setCurrentCoords(null);
    setSearchCity(trimmedCity);
    addToSearchHistory(trimmedCity);
  };
  
  // Hàm refresh thời tiết
  const handleRefresh = (): void => {
    if (searchCity) {
      refreshMutation.mutate({ city: searchCity });
    }
  };
  
  // Hàm thêm vào danh sách yêu thích
  const handleAddToFavorites = (): void => {
    if (finalWeatherData) {
      addFavoriteCity({
        name: finalWeatherData.name,
        country: finalWeatherData.sys?.country || ''
      });
      Alert.alert('Thành công', `Đã thêm ${finalWeatherData.name} vào danh sách yêu thích`);
    }
  };

  const handleSearch = (searchTerm: string = city): void => {
    if (!searchTerm.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên thành phố');
      return;
    }

    const trimmedCity = searchTerm.trim();
    console.info(`[MÀN_HÌNH_THỜI_TIẾT] Tìm kiếm thời tiết cho thành phố: ${trimmedCity}`);
    console.info('[MÀN_HÌNH_THỜI_TIẾT] Gọi API thời tiết hiện tại');
    console.info('[MÀN_HÌNH_THỜI_TIẾT] Gọi API dự báo thời tiết');
    setSearchCity(trimmedCity);
    addToSearchHistory(trimmedCity);
  };

  const handleCurrentLocation = async (): Promise<void> => {
    try {
      const locationData = await getCurrentLocationWithCity();
      if (locationData && locationData.success && locationData.coordinates) {
        // Set coordinates to use coordinates-based weather API
        setCurrentCoords({
          lat: locationData.coordinates.latitude,
          lon: locationData.coordinates.longitude
        });
        // Update city name for display
        if (locationData.cityName) {
          setCity(locationData.cityName);
        }
      } else {
        Alert.alert('Lỗi', locationData?.error || 'Không thể lấy vị trí hiện tại');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lấy vị trí hiện tại. Vui lòng kiểm tra quyền truy cập vị trí.');
    }
  };



  const getWeatherIcon = (iconCode: string): string => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('vi-VN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Hàm dịch mô tả thời tiết sang tiếng Việt
  const translateWeatherDescription = (description: string): string => {
    const translations: { [key: string]: string } = {
      // Clear sky
      'clear sky': 'trời quang đãng',
      'clear': 'quang đãng',
      
      // Clouds
      'few clouds': 'ít mây',
      'scattered clouds': 'mây rải rác',
      'broken clouds': 'mây cụm',
      'overcast clouds': 'mây u ám',
      'partly cloudy': 'có mây',
      'cloudy': 'nhiều mây',
      
      // Rain
      'light rain': 'mưa nhẹ',
      'moderate rain': 'mưa vừa',
      'heavy intensity rain': 'mưa to',
      'very heavy rain': 'mưa rất to',
      'extreme rain': 'mưa cực to',
      'freezing rain': 'mưa đá',
      'light intensity shower rain': 'mưa rào nhẹ',
      'shower rain': 'mưa rào',
      'heavy intensity shower rain': 'mưa rào to',
      'ragged shower rain': 'mưa rào không đều',
      'rain': 'mưa',
      
      // Drizzle
      'light intensity drizzle': 'mưa phùn nhẹ',
      'drizzle': 'mưa phùn',
      'heavy intensity drizzle': 'mưa phùn to',
      'light intensity drizzle rain': 'mưa phùn nhẹ',
      'drizzle rain': 'mưa phùn',
      'heavy intensity drizzle rain': 'mưa phùn to',
      'shower rain and drizzle': 'mưa rào và mưa phùn',
      'heavy shower rain and drizzle': 'mưa rào to và mưa phùn',
      'shower drizzle': 'mưa phùn rào',
      
      // Thunderstorm
      'thunderstorm with light rain': 'giông bão có mưa nhẹ',
      'thunderstorm with rain': 'giông bão có mưa',
      'thunderstorm with heavy rain': 'giông bão có mưa to',
      'light thunderstorm': 'giông nhẹ',
      'thunderstorm': 'giông bão',
      'heavy thunderstorm': 'giông bão mạnh',
      'ragged thunderstorm': 'giông bão không đều',
      'thunderstorm with light drizzle': 'giông bão có mưa phùn nhẹ',
      'thunderstorm with drizzle': 'giông bão có mưa phùn',
      'thunderstorm with heavy drizzle': 'giông bão có mưa phùn to',
      
      // Snow
      'light snow': 'tuyết nhẹ',
      'snow': 'tuyết',
      'heavy snow': 'tuyết to',
      'sleet': 'mưa tuyết',
      'light shower sleet': 'mưa tuyết rào nhẹ',
      'shower sleet': 'mưa tuyết rào',
      'light rain and snow': 'mưa nhẹ và tuyết',
      'rain and snow': 'mưa và tuyết',
      'light shower snow': 'tuyết rào nhẹ',
      'shower snow': 'tuyết rào',
      'heavy shower snow': 'tuyết rào to',
      
      // Atmosphere
      'mist': 'sương mù',
      'smoke': 'khói',
      'haze': 'sương khô',
      'sand/dust whirls': 'lốc cát/bụi',
      'fog': 'sương mù dày đặc',
      'sand': 'cát',
      'dust': 'bụi',
      'volcanic ash': 'tro núi lửa',
      'squalls': 'gió giật',
      'tornado': 'lốc xoáy'
    };
    
    const lowerDescription = description.toLowerCase();
    return translations[lowerDescription] || description;
  };

  const renderCurrentWeather = (): React.ReactElement | null => {
    if (!finalWeatherData) return null;

    const temperature = temperatureUnit === 'celsius' 
      ? Math.round(finalWeatherData.main.temp)
      : Math.round(finalWeatherData.main.temp * 9/5 + 32);
    const feelsLike = temperatureUnit === 'celsius'
      ? Math.round(finalWeatherData.main.feels_like)
      : Math.round(finalWeatherData.main.feels_like * 9/5 + 32);
    const unit = temperatureUnit === 'celsius' ? '°C' : '°F';

    return (
      <ScrollView style={styles.weatherContainer}>
        <View style={styles.currentWeatherCard}>
          <View style={styles.locationContainer}>
            <Text style={styles.cityName}>{currentCoords ? city : finalWeatherData.name}</Text>
            <Text style={styles.countryName}>{finalWeatherData.sys?.country}</Text>
            <TouchableOpacity 
              style={styles.favoriteButton}
              onPress={handleAddToFavorites}
            >
              <Text style={styles.favoriteText}>⭐ Yêu thích</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.mainWeatherInfo}>
            <Image 
              source={{ uri: getWeatherIcon(finalWeatherData.weather[0].icon) }}
              style={styles.weatherIcon}
            />
            <Text style={styles.temperatureSmall}>{temperature}{unit}</Text>
            <Text style={styles.description}>{translateWeatherDescription(finalWeatherData.weather[0].description)}</Text>
          </View>

          {/* Khả năng mưa trung tâm nổi bật cho thời tiết hiện tại */}
          {finalForecastData && finalForecastData.list && finalForecastData.list[0] && (() => {
            const currentRainChance = Math.round(finalForecastData.list[0].pop * 100) || 0;
            const currentRainInfo = getRainInfo(currentRainChance);
            return (
              <View style={[
                styles.rainCenterSection,
                {
                  backgroundColor: currentRainInfo.backgroundColor,
                  borderColor: currentRainInfo.borderColor,
                }
              ]}>
                <Text style={[styles.rainCenterLabel, { color: currentRainInfo.color }]}>
                  {currentRainInfo.icon} Khả năng mưa hiện tại
                </Text>
                <Text style={[styles.rainCenterValue, { color: currentRainInfo.color }]}>
                  {currentRainChance}%
                </Text>
                <Text style={[styles.rainCenterNote, { color: currentRainInfo.color }]}>
                  {currentRainInfo.description}
                </Text>
              </View>
            );
          })()}
          
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Cảm giác như</Text>
                <Text style={styles.detailValue}>{feelsLike}{unit}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Độ ẩm</Text>
                <Text style={styles.detailValue}>{finalWeatherData.main.humidity}%</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Áp suất</Text>
                <Text style={styles.detailValue}>{finalWeatherData.main.pressure} hPa</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Gió</Text>
                <Text style={styles.detailValue}>{finalWeatherData.wind?.speed || 0} m/s</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Tầm nhìn</Text>
                <Text style={styles.detailValue}>{(finalWeatherData.visibility || 0) / 1000} km</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  // Hàm xác định màu sắc và mô tả theo mức độ mưa
  const getRainInfo = (rainChance: number) => {
    if (rainChance === 0) {
      return {
        color: '#95a5a6',
        backgroundColor: '#ecf0f1',
        borderColor: '#bdc3c7',
        description: 'Không mưa',
        icon: '☀️'
      };
    } else if (rainChance <= 30) {
      return {
        color: '#3498db',
        backgroundColor: '#ebf3fd',
        borderColor: '#3498db',
        description: 'Mưa nhẹ',
        icon: '🌦️'
      };
    } else if (rainChance <= 60) {
      return {
        color: '#f39c12',
        backgroundColor: '#fef9e7',
        borderColor: '#f39c12',
        description: 'Mưa vừa',
        icon: '🌧️'
      };
    } else {
      return {
        color: '#e74c3c',
        backgroundColor: '#fdedec',
        borderColor: '#e74c3c',
        description: 'Mưa to',
        icon: '⛈️'
      };
    }
  };

  const renderHourlyForecast = (): React.ReactElement | null => {
    if (!finalForecastData || !finalForecastData.list) return null;

    // Lấy dự báo 24 giờ tới (24 items đầu tiên, mỗi item cách nhau 1 giờ)
    // OpenWeather API trả về dữ liệu mỗi 3 giờ, nên ta sẽ lấy tất cả có thể để hiển thị
    const hourlyForecast = finalForecastData.list.slice(0, 24);

    return (
      <View style={styles.forecastCard}>
        <Text style={styles.forecastTitle}>DỰ BÁO THỜI TIẾT CHO NÔNG DÂN</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {hourlyForecast.map((item: ForecastItemData, index: number) => {
            const date = new Date(item.dt * 1000);
            const timeString = date.toLocaleTimeString('vi-VN', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            });
            
            // Hiển thị đầy đủ thứ, ngày, tháng, năm
            const fullDateString = date.toLocaleDateString('vi-VN', { 
              weekday: 'long',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            });
            
            const temperature = temperatureUnit === 'celsius' 
              ? Math.round(item.main.temp)
              : Math.round(item.main.temp * 9/5 + 32);
            const unit = temperatureUnit === 'celsius' ? '°C' : '°F';
            
            // Chuyển đổi pop từ 0-1 sang 0-100%
            const rainProbability = Math.round((item.pop || 0) * 100);
            const rainInfo = getRainInfo(rainProbability);
            
            return (
              <View key={index} style={styles.hourlyItemLarge}>
                <View style={styles.hourlyTimeSection}>
                  <Text style={styles.hourlyTimeTextLarge}>{timeString}</Text>
                  <Text style={styles.hourlyDateTextLarge}>{fullDateString}</Text>
                </View>
                
                {/* Khả năng mưa - Trung tâm và to nhất với màu sắc theo mức độ */}
                <View style={[
                  styles.rainCenterSection,
                  {
                    backgroundColor: rainInfo.backgroundColor,
                    borderColor: rainInfo.borderColor,
                  }
                ]}>
                  <Text style={[styles.rainCenterLabel, { color: rainInfo.color }]}>KHẢ NĂNG MƯA</Text>
                  <Text style={[styles.rainCenterValue, { color: rainInfo.color }]}>
                    {rainInfo.icon} {rainProbability}%
                  </Text>
                  <Text style={[styles.rainCenterNote, { color: rainInfo.color }]}>{rainInfo.description}</Text>
                </View>
                
                <View style={styles.hourlyWeatherSection}>
                  <Image
                    source={{
                      uri: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`
                    }}
                    style={styles.hourlyIconLarge}
                  />
                  
                  <View style={styles.hourlyTempSection}>
                    <Text style={styles.hourlyTemperatureSmall}>{temperature}{unit}</Text>
                    <Text style={styles.hourlyDescriptionLarge}>{translateWeatherDescription(item.weather[0].description)}</Text>
                  </View>
                </View>
                
                <View style={styles.hourlyDetailsSection}>
                  <View style={styles.hourlyDetailItem}>
                    <Text style={styles.hourlyDetailLabel}>ĐỘ ẨM</Text>
                    <Text style={styles.hourlyHumidityLarge}>💧 {item.main.humidity}%</Text>
                  </View>
                  <View style={styles.hourlyDetailItem}>
                    <Text style={styles.hourlyDetailLabel}>GIÓ</Text>
                    <Text style={styles.hourlyWindLarge}>💨 {item.wind?.speed || 0} m/s</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderForecast = (): React.ReactElement | null => {
    if (!finalForecastData || !finalForecastData.list) return null;

    // Lấy dự báo cho 5 ngày tiếp theo (mỗi ngày 1 dự báo vào lúc 12:00)
    const dailyForecast = finalForecastData.list.filter((item: ForecastItemData, index: number) => {
      const date = new Date(item.dt * 1000);
      return date.getHours() === 12 || index % 8 === 0; // Mỗi 8 items = 1 ngày (3h interval)
    }).slice(0, 5);

    return (
      <View style={styles.forecastCard}>
        <Text style={styles.forecastTitleLarge}>Dự báo 5 ngày tới - Dành cho Nông dân</Text>
        {dailyForecast.map((item: ForecastItemData, index: number) => {
          const date = new Date(item.dt * 1000);
          const dayName = date.toLocaleDateString('vi-VN', { weekday: 'long' });
          const fullDate = date.toLocaleDateString('vi-VN', { 
            weekday: 'long',
            day: '2-digit', 
            month: '2-digit',
            year: 'numeric'
          });
          
          const temperature = temperatureUnit === 'celsius' 
            ? Math.round(item.main.temp)
            : Math.round(item.main.temp * 9/5 + 32);
          const unit = temperatureUnit === 'celsius' ? '°C' : '°F';
          const rainChance = item.pop ? Math.round(item.pop * 100) : 0;
          const rainInfo = getRainInfo(rainChance);
          
          return (
            <View key={index} style={styles.forecastItemLarge}>
              {/* Phần ngày tháng */}
              <View style={styles.forecastDateSection}>
                <Text style={styles.forecastDateTextLarge}>{fullDate}</Text>
              </View>
              
              {/* Phần thời tiết chính */}
              <View style={styles.forecastWeatherSection}>
                <Image
                  source={{
                    uri: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`
                  }}
                  style={styles.forecastIconLarge}
                />
                <View style={styles.forecastTempSection}>
                   <Text style={styles.forecastTemperatureSmall}>{temperature}{unit}</Text>
                   <Text style={styles.forecastDescriptionLarge}>{translateWeatherDescription(item.weather[0].description)}</Text>
                 </View>
              </View>
              
              {/* Khả năng mưa trung tâm nổi bật với màu sắc theo mức độ */}
              <View style={[
                styles.rainCenterSection,
                {
                  backgroundColor: rainInfo.backgroundColor,
                  borderColor: rainInfo.borderColor,
                }
              ]}>
                <Text style={[styles.rainCenterLabel, { color: rainInfo.color }]}>
                  {rainInfo.icon} Khả năng mưa
                </Text>
                <Text style={[styles.rainCenterValue, { color: rainInfo.color }]}>
                  {rainChance}%
                </Text>
                <Text style={[styles.rainCenterNote, { color: rainInfo.color }]}>
                  {rainInfo.description}
                </Text>
              </View>
              
              {/* Thông tin chi tiết */}
              <View style={styles.forecastDetailsSection}>
                <View style={styles.forecastDetailItem}>
                  <Text style={styles.forecastDetailLabel}>Độ ẩm</Text>
                  <Text style={styles.forecastHumidityLarge}>{item.main.humidity}%</Text>
                </View>
                <View style={styles.forecastDetailItem}>
                  <Text style={styles.forecastDetailLabel}>Gió</Text>
                  <Text style={styles.forecastWindLarge}>{item.wind?.speed || 0} m/s</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Thời Tiết</Text>
        
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Nhập tên thành phố..."
            value={city}
            onChangeText={setCity}
            onSubmitEditing={() => handleSearch()}
          />
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={searchWeather}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.searchButtonText}>Tìm kiếm</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.searchButton, styles.refreshButton]}
            onPress={handleRefresh}
            disabled={loading}
          >
            <Text style={styles.searchButtonText}>🔄 Làm mới</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.searchButton, styles.locationButton]}
            onPress={handleCurrentLocation}
            disabled={loading}
          >
            <Text style={styles.searchButtonText}>📍 Vị trí</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'current' && styles.activeTab]}
            onPress={() => setActiveTab('current')}
          >
            <Text style={[styles.tabText, activeTab === 'current' && styles.activeTabText]}>Hiện tại</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'hourly' && styles.activeTab]}
            onPress={() => setActiveTab('hourly')}
          >
            <Text style={[styles.tabText, activeTab === 'hourly' && styles.activeTabText]}>Theo giờ</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'forecast' && styles.activeTab]}
            onPress={() => setActiveTab('forecast')}
          >
            <Text style={[styles.tabText, activeTab === 'forecast' && styles.activeTabText]}>Dự báo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Đang tải dữ liệu thời tiết...</Text>
        </View>
      ) : (
        activeTab === 'current' ? renderCurrentWeather() : 
        activeTab === 'hourly' ? renderHourlyForecast() : 
        renderForecast()
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
  },
  header: {
    backgroundColor: '#4A90E2',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#2E7BD6',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: '#28a745',
    marginLeft: 5,
  },
  locationButton: {
    backgroundColor: '#ff6b35',
    marginLeft: 5,
  },
  searchButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  favoriteButton: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginTop: 5,
  },
  favoriteText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: 'white',
  },
  tabText: {
    color: 'white',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#4A90E2',
  },
  weatherContainer: {
    flex: 1,
    padding: 20,
  },
  currentWeatherCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  cityName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  countryName: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  mainWeatherInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  weatherIcon: {
    width: 100,
    height: 100,
  },
  temperature: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginTop: 10,
  },
  temperatureSmall: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginTop: 10,
  },
  description: {
    fontSize: 18,
    color: '#666',
    textTransform: 'capitalize',
  },
  detailsContainer: {
    marginTop: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  forecastCard: {
    flex: 1,
    padding: 20,
  },
  forecastTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  forecastItem: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  forecastDate: {
    width: 60,
    alignItems: 'center',
  },
  dayName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  dayMonth: {
    fontSize: 12,
    color: '#666',
  },
  forecastIcon: {
    width: 50,
    height: 50,
    marginHorizontal: 10,
  },
  forecastTemp: {
    flex: 1,
  },
  forecastTemperature: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  forecastDescription: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  forecastDetails: {
    alignItems: 'flex-end',
  },
  forecastHumidity: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  forecastWind: {
    fontSize: 12,
    color: '#666',
  },
  hourlyItem: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  hourlyTime: {
    width: 80,
    alignItems: 'center',
  },
  hourlyTimeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  hourlyDateText: {
    fontSize: 12,
    color: '#666',
  },
  hourlyIcon: {
    width: 50,
    height: 50,
    marginHorizontal: 10,
  },
  hourlyTemp: {
    flex: 1,
  },
  hourlyTemperature: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  hourlyDescription: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  hourlyDetails: {
    alignItems: 'flex-end',
  },
  hourlyRain: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  hourlyHumidity: {
    fontSize: 12,
    color: '#666',
  },
  // Styles mới cho giao diện nông dân
  hourlyItemLarge: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  hourlyTimeSection: {
    marginBottom: 15,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
  },
  hourlyTimeTextLarge: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  hourlyDateTextLarge: {
    fontSize: 16,
    color: '#34495e',
    fontWeight: '600',
    textAlign: 'center',
  },
  hourlyWeatherSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#f0f8ff',
    padding: 15,
    borderRadius: 12,
  },
  hourlyIconLarge: {
    width: 70,
    height: 70,
    marginRight: 15,
  },
  hourlyTempSection: {
    flex: 1,
  },
  hourlyTemperatureLarge: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 4,
  },
  hourlyDescriptionLarge: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  hourlyDetailsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hourlyDetailItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  hourlyDetailLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#7f8c8d',
    marginBottom: 6,
    textAlign: 'center',
  },
  hourlyRainLarge: {
    fontSize: 18,
    color: '#3498db',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  hourlyHumidityLarge: {
    fontSize: 18,
    color: '#27ae60',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Style cho khả năng mưa trung tâm
  rainCenterSection: {
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 20,
    marginVertical: 15,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#2196f3',
    shadowColor: '#2196f3',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  rainCenterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8,
    textAlign: 'center',
  },
  rainCenterValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#0d47a1',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(13, 71, 161, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  rainCenterNote: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1565c0',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  hourlyWindLarge: {
    fontSize: 18,
    color: '#9c27b0',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  hourlyTemperatureSmall: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 4,
  },
  // Styles cho tab Dự báo cải tiến
  forecastTitleLarge: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  forecastItemLarge: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  forecastDateSection: {
    marginBottom: 15,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
  },
  forecastDateTextLarge: {
    fontSize: 18,
    color: '#34495e',
    fontWeight: '600',
    textAlign: 'center',
  },
  forecastWeatherSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#f0f8ff',
    padding: 15,
    borderRadius: 12,
  },
  forecastIconLarge: {
    width: 70,
    height: 70,
    marginRight: 15,
  },
  forecastTempSection: {
    flex: 1,
  },
  forecastTemperatureLarge: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 4,
  },
  forecastDescriptionLarge: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  forecastDetailsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  forecastDetailItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  forecastDetailLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#7f8c8d',
    marginBottom: 6,
    textAlign: 'center',
  },
  forecastHumidityLarge: {
    fontSize: 18,
    color: '#27ae60',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  forecastWindLarge: {
     fontSize: 18,
     color: '#9c27b0',
     fontWeight: 'bold',
     textAlign: 'center',
   },
   forecastTemperatureSmall: {
     fontSize: 20,
     fontWeight: 'bold',
     color: '#e74c3c',
     marginBottom: 4,
   },
 });

export default WeatherScreen;