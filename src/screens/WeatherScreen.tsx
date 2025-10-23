import React, { useState, useEffect, JSX, useRef } from "react"
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
} from "react-native"
import WeatherItem from "../components/WeatherItem"
import YouTubeVideoItem, { YouTubeVideo } from "../components/YouTubeVideoItem"
import { extractVideos } from "../utils/videoUtils"
import {
  useCurrentWeather,
  useWeatherForecast,
  useRefreshWeather,
  useCurrentWeatherByCoords,
  useWeatherForecastByCoords,
} from "../services/weatherService"
import {
  useClimateForecast,
  useClimateYouTubeVideos,
} from "../services/climateService"
import {
  useAppSettings,
  useTemperatureSettings,
  useFavoriteCities,
  useSearchHistory,
} from "../store"
import { getCurrentLocationWithCity } from "../services/locationService"
import YoutubePlayer from "react-native-youtube-iframe"

const { width } = Dimensions.get("window")

type TabType = "current" | "forecast" | "hourly" | "climate"

interface ForecastItemData {
  dt: number
  main: {
    temp: number
    humidity: number
  }
  weather: Array<{
    icon: string
    description: string
  }>
  wind?: {
    speed: number
  }
  pop?: number // Probability of precipitation (0-1)
}

export default function WeatherScreen() {
  const [city, setCity] = useState<string>("Ho Chi Minh City")
  const [searchCity, setSearchCity] = useState<string>("Ho Chi Minh City")
  const [currentCoords, setCurrentCoords] = useState<{
    lat: number
    lon: number
  } | null>(null)
  const scrollViewRef = useRef<ScrollView>(null)
  const tabRefs = useRef<Array<{ x: number; width: number }>>([])

  // Zustand stores
  const { theme } = useAppSettings()
  const { temperatureUnit } = useTemperatureSettings()
  const { favoriteCities, addFavoriteCity } = useFavoriteCities()
  const { addToSearchHistory } = useSearchHistory()

  // TanStack Query hooks
  const {
    data: weatherData,
    isLoading: weatherLoading,
    error: weatherError,
    refetch: refetchWeather,
  } = useCurrentWeather(searchCity, { enabled: !currentCoords })

  const {
    data: forecastData,
    isLoading: forecastLoading,
    error: forecastError,
  } = useWeatherForecast(searchCity, { enabled: !currentCoords })

  // Hooks for coordinates-based weather
  const {
    data: coordsWeatherData,
    isLoading: coordsWeatherLoading,
    error: coordsWeatherError,
  } = useCurrentWeatherByCoords(
    currentCoords?.lat || 0,
    currentCoords?.lon || 0,
    { enabled: !!currentCoords }
  )

  const {
    data: coordsForecastData,
    isLoading: coordsForecastLoading,
    error: coordsForecastError,
  } = useWeatherForecastByCoords(
    currentCoords?.lat || 0,
    currentCoords?.lon || 0,
    { enabled: !!currentCoords }
  )

  // TanStack Query hooks for climate data
  const {
    data: climateForecastData,
    isLoading: climateForecastLoading,
    error: climateForecastError,
  } = useClimateForecast()

  const {
    data: climateVideosData,
    isLoading: climateVideosLoading,
    error: climateVideosError,
  } = useClimateYouTubeVideos()
  console.log("🚀 ~ WeatherScreen ~ climateVideosData:", climateVideosData)

  const refreshMutation = useRefreshWeather()

  // Use coordinates data if available, otherwise use city data
  const finalWeatherData = currentCoords ? coordsWeatherData : weatherData
  const finalForecastData = currentCoords ? coordsForecastData : forecastData
  const loading =
    (currentCoords
      ? coordsWeatherLoading || coordsForecastLoading
      : weatherLoading || forecastLoading) || refreshMutation.isPending
  const error = currentCoords
    ? coordsWeatherError || coordsForecastError
    : weatherError || forecastError
  const [activeTab, setActiveTab] = useState<TabType>("current")

  // Scroll to selected tab
  const scrollToTab = (index: number) => {
    if (scrollViewRef.current && tabRefs.current[index]) {
      const { x, width } = tabRefs.current[index]
      // @ts-ignore
      scrollViewRef.current.scrollTo({
        x: x - Dimensions.get("window").width / 2 + width / 2,
        animated: true,
      })
    }
  }

  // Handle tab change with scroll
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    // Scroll to make the tab visible
    const tabIndex =
      {
        current: 0,
        hourly: 1,
        forecast: 2,
        climate: 3,
      }[tab] || 0

    setTimeout(() => {
      scrollToTab(tabIndex)
    }, 100)
  }

  // Tự động lấy vị trí hiện tại khi khởi động ứng dụng
  useEffect(() => {
    console.info(
      "[MÀN_HÌNH_THỜI_TIẾT] Component đã mount, tự động lấy vị trí hiện tại"
    )
    handleCurrentLocation()
  }, [])

  // Hàm tìm kiếm thời tiết
  const searchWeather = (): void => {
    if (!city.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên thành phố")
      return
    }

    const trimmedCity = city.trim()
    console.info(
      `[MÀN_HÌNH_THỜI_TIẾT] Tìm kiếm thời tiết cho thành phố: ${trimmedCity}`
    )
    console.info("[MÀN_HÌNH_THỜI_TIẾT] Gọi API thời tiết hiện tại")
    console.info("[MÀN_HÌNH_THỜI_TIẾT] Gọi API dự báo thời tiết")

    // Reset coordinates to use city-based search
    setCurrentCoords(null)
    setSearchCity(trimmedCity)
    addToSearchHistory(trimmedCity)
  }

  // Hàm refresh thời tiết - ưu tiên vị trí hiện tại nếu có
  const handleRefresh = (): void => {
    if (currentCoords) {
      // Refresh bằng vị trí hiện tại
      handleCurrentLocation()
    } else if (searchCity) {
      // Fallback về city-based search
      refreshMutation.mutate({ city: searchCity })
    }
  }

  // Hàm thêm vào danh sách yêu thích
  const handleAddToFavorites = (): void => {
    if (finalWeatherData) {
      addFavoriteCity({
        name: finalWeatherData.name,
        country: finalWeatherData.sys?.country || "",
      })
      Alert.alert(
        "Thành công",
        `Đã thêm ${finalWeatherData.name} vào danh sách yêu thích`
      )
    }
  }

  const handleSearch = (searchTerm: string = city): void => {
    if (!searchTerm.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên thành phố")
      return
    }

    const trimmedCity = searchTerm.trim()
    console.info(
      `[MÀN_HÌNH_THỜI_TIẾT] Tìm kiếm thời tiết cho thành phố: ${trimmedCity}`
    )
    console.info("[MÀN_HÌNH_THỜI_TIẾT] Gọi API thời tiết hiện tại")
    console.info("[MÀN_HÌNH_THỜI_TIẾT] Gọi API dự báo thời tiết")
    setSearchCity(trimmedCity)
    addToSearchHistory(trimmedCity)
  }

  const handleCurrentLocation = async (): Promise<void> => {
    try {
      const locationData = await getCurrentLocationWithCity()
      if (locationData && locationData.success && locationData.coordinates) {
        // Set coordinates to use coordinates-based weather API
        setCurrentCoords({
          lat: locationData.coordinates.latitude,
          lon: locationData.coordinates.longitude,
        })
        // Update city name for display
        if (locationData.cityName) {
          setCity(locationData.cityName)
        }
      } else {
        Alert.alert(
          "Lỗi",
          locationData?.error || "Không thể lấy vị trí hiện tại"
        )
      }
    } catch (error) {
      Alert.alert(
        "Lỗi",
        "Không thể lấy vị trí hiện tại. Vui lòng kiểm tra quyền truy cập vị trí."
      )
    }
  }

  const getWeatherIcon = (iconCode: string): string => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("vi-VN", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Hàm dịch mô tả thời tiết sang tiếng Việt
  const translateWeatherDescription = (description: string): string => {
    const translations: { [key: string]: string } = {
      // Clear sky
      "clear sky": "trời quang đãng",
      clear: "quang đãng",

      // Clouds
      "few clouds": "ít mây",
      "scattered clouds": "mây rải rác",
      "broken clouds": "mây cụm",
      "overcast clouds": "mây u ám",
      "partly cloudy": "có mây",
      cloudy: "nhiều mây",

      // Rain
      "light rain": "mưa nhẹ",
      "moderate rain": "mưa vừa",
      "heavy intensity rain": "mưa to",
      "very heavy rain": "mưa rất to",
      "extreme rain": "mưa cực to",
      "freezing rain": "mưa đá",
      "light intensity shower rain": "mưa rào nhẹ",
      "shower rain": "mưa rào",
      "heavy intensity shower rain": "mưa rào to",
      "ragged shower rain": "mưa rào không đều",
      rain: "mưa",

      // Drizzle
      "light intensity drizzle": "mưa phùn nhẹ",
      drizzle: "mưa phùn",
      "heavy intensity drizzle": "mưa phùn to",
      "light intensity drizzle rain": "mưa phùn nhẹ",
      "drizzle rain": "mưa phùn",
      "heavy intensity drizzle rain": "mưa phùn to",
      "shower rain and drizzle": "mưa rào và mưa phùn",
      "heavy shower rain and drizzle": "mưa rào to và mưa phùn",
      "shower drizzle": "mưa phùn rào",

      // Thunderstorm
      "thunderstorm with light rain": "giông bão có mưa nhẹ",
      "thunderstorm with rain": "giông bão có mưa",
      "thunderstorm with heavy rain": "giông bão có mưa to",
      "light thunderstorm": "giông nhẹ",
      thunderstorm: "giông bão",
      "heavy thunderstorm": "giông bão mạnh",
      "ragged thunderstorm": "giông bão không đều",
      "thunderstorm with light drizzle": "giông bão có mưa phùn nhẹ",
      "thunderstorm with drizzle": "giông bão có mưa phùn",
      "thunderstorm with heavy drizzle": "giông bão có mưa phùn to",

      // Snow
      "light snow": "tuyết nhẹ",
      snow: "tuyết",
      "heavy snow": "tuyết to",
      sleet: "mưa tuyết",
      "light shower sleet": "mưa tuyết rào nhẹ",
      "shower sleet": "mưa tuyết rào",
      "light rain and snow": "mưa nhẹ và tuyết",
      "rain and snow": "mưa và tuyết",
      "light shower snow": "tuyết rào nhẹ",
      "shower snow": "tuyết rào",
      "heavy shower snow": "tuyết rào to",

      // Atmosphere
      mist: "sương mù",
      smoke: "khói",
      haze: "sương khô",
      "sand/dust whirls": "lốc cát/bụi",
      fog: "sương mù dày đặc",
      sand: "cát",
      dust: "bụi",
      "volcanic ash": "tro núi lửa",
      squalls: "gió giật",
      tornado: "lốc xoáy",
    }

    const lowerDescription = description.toLowerCase()
    return translations[lowerDescription] || description
  }

  const renderCurrentWeather = (): React.ReactElement | null => {
    if (!finalWeatherData) return null

    // Tạo item data từ current weather để sử dụng với WeatherItem
    const currentWeatherItem = {
      dt: Math.floor(Date.now() / 1000), // Current timestamp
      main: finalWeatherData.main,
      weather: finalWeatherData.weather,
      wind: finalWeatherData.wind,
      pop: finalForecastData?.list?.[0]?.pop || 0, // Lấy khả năng mưa từ forecast
    }

    // Lấy địa chỉ để hiển thị
    const locationDisplay = city || finalWeatherData?.name || "Vị trí hiện tại"

    return (
      <View style={styles.forecastCard}>
        <Text style={styles.forecastTitleLarge}>{locationDisplay}</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          <WeatherItem
            item={currentWeatherItem}
            getRainInfo={getRainInfo}
            translateWeatherDescription={translateWeatherDescription}
            tabType='current'
          />
        </ScrollView>
      </View>
    )
  }

  // Hàm xác định màu sắc và mô tả theo mức độ mưa
  const getRainInfo = (rainChance: number) => {
    if (rainChance === 0) {
      return {
        color: "#95a5a6",
        backgroundColor: "#ecf0f1",
        borderColor: "#bdc3c7",
        description: "Không mưa",
        icon: "☀️",
      }
    } else if (rainChance <= 30) {
      return {
        color: "#3498db",
        backgroundColor: "#ebf3fd",
        borderColor: "#3498db",
        description: "Mưa nhẹ",
        icon: "🌦️",
      }
    } else if (rainChance <= 60) {
      return {
        color: "#f39c12",
        backgroundColor: "#fef9e7",
        borderColor: "#f39c12",
        description: "Mưa vừa",
        icon: "🌧️",
      }
    } else {
      return {
        color: "#e74c3c",
        backgroundColor: "#fdedec",
        borderColor: "#e74c3c",
        description: "Mưa to",
        icon: "⛈️",
      }
    }
  }

  const renderHourlyForecast = (): React.ReactElement | null => {
    if (!finalForecastData || !finalForecastData.list) return null

    // Lấy dự báo 24 giờ tới (24 items đầu tiên, mỗi item cách nhau 1 giờ)
    // OpenWeather API trả về dữ liệu mỗi 3 giờ, nên ta sẽ lấy tất cả có thể để hiển thị
    const hourlyForecast = finalForecastData.list.slice(0, 24)

    // Lấy địa chỉ để hiển thị
    const locationDisplay = city || finalWeatherData?.name || "Vị trí hiện tại"

    return (
      <View style={styles.forecastCard}>
        <Text style={styles.forecastTitleLarge}>{locationDisplay}</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {hourlyForecast.map((item: ForecastItemData, index: number) => (
            <WeatherItem
              key={index}
              item={item}
              getRainInfo={getRainInfo}
              translateWeatherDescription={translateWeatherDescription}
              tabType='hourly'
            />
          ))}
        </ScrollView>
      </View>
    )
  }

  const renderForecast = (): React.ReactElement | null => {
    if (!finalForecastData || !finalForecastData.list) return null

    // Lấy dự báo cho 5 ngày tiếp theo (mỗi ngày 1 dự báo vào lúc 12:00)
    const dailyForecast = finalForecastData.list
      .filter((item: ForecastItemData, index: number) => {
        const date = new Date(item.dt * 1000)
        return date.getHours() === 12 || index % 8 === 0 // Mỗi 8 items = 1 ngày (3h interval)
      })
      .slice(0, 5)

    // Lấy địa chỉ để hiển thị
    const locationDisplay = city || finalWeatherData?.name || "Vị trí hiện tại"

    return (
      <View style={styles.forecastCard}>
        <Text style={styles.forecastTitleLarge}>{locationDisplay}</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {dailyForecast.map((item: ForecastItemData, index: number) => (
            <WeatherItem
              key={index}
              item={item}
              getRainInfo={getRainInfo}
              translateWeatherDescription={translateWeatherDescription}
              tabType='forecast'
            />
          ))}
        </ScrollView>
      </View>
    )
  }

  // Hàm lấy video ID từ URL YouTube
  const getVideoId = (url: string): string => {
    const videoIdMatch = url.match(
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    )
    return videoIdMatch ? videoIdMatch[1] : ""
  }

  // Component hiển thị dự báo khí hậu
  const renderClimateForecast = (): React.ReactElement | null => {
    if (climateForecastLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#4A90E2' />
          <Text style={styles.loadingText}>Đang tải dữ liệu khí hậu...</Text>
        </View>
      )
    }

    if (climateForecastError) {
      return (
        <View style={styles.forecastCard}>
          <Text style={styles.forecastTitleLarge}>Lỗi tải dữ liệu</Text>
          <Text style={styles.description}>
            Không thể tải dữ liệu dự báo khí hậu. Vui lòng thử lại sau.
          </Text>
        </View>
      )
    }

    if (!climateForecastData) {
      return (
        <View style={styles.forecastCard}>
          <Text style={styles.forecastTitleLarge}>Dữ liệu khí hậu</Text>
          <Text style={styles.description}>
            Dữ liệu dự báo khí hậu đang được cập nhật.
          </Text>
        </View>
      )
    }

    return (
      <View style={styles.forecastCard}>
        <Text style={styles.forecastTitleLarge}>Dự báo khí hậu</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.currentWeatherCard}>
            {/* Climate Summary */}
            <Text style={styles.description}>
              {climateForecastData.summary}
            </Text>

            <View style={styles.insightsContainer}>
              <Text style={styles.sectionTitle}>Thông tin thủy văn:</Text>
              <Text style={styles.insightText}>
                {climateForecastData.hydrologyInfo}
              </Text>
            </View>

            <View style={styles.insightsContainer}>
              <Text style={styles.sectionTitle}>Mực nước sông:</Text>
              <Text style={styles.insightText}>
                {climateForecastData.waterLevelInfo}
              </Text>
            </View>

            <View style={styles.insightsContainer}>
              <Text style={styles.sectionTitle}>Nguồn dữ liệu:</Text>
              {climateForecastData.dataSources.map((source, index) => (
                <Text key={index} style={styles.insightText}>
                  • {source}
                </Text>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    )
  }

  // State để theo dõi số lượng video bị ẩn trong tab khí hậu
  const [hiddenClimateVideos, setHiddenClimateVideos] = React.useState<
    Set<string>
  >(new Set())

  // Hàm xử lý khi video khí hậu bị ẩn
  const handleClimateVideoHidden = React.useCallback((videoId: string) => {
    setHiddenClimateVideos((prev) => new Set(prev).add(videoId))
  }, [])

  // Component hiển thị video YouTube
  const renderClimateVideos = (): React.ReactElement | null => {
    if (climateVideosLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#4A90E2' />
          <Text style={styles.loadingText}>Đang tải video...</Text>
        </View>
      )
    }

    if (climateVideosError) {
      return (
        <View style={styles.forecastCard}>
          <Text style={styles.forecastTitleLarge}>Lỗi tải video</Text>
          <Text style={styles.description}>
            Không thể tải video YouTube. Vui lòng thử lại sau.
          </Text>
        </View>
      )
    }

    // Sử dụng utility function để trích xuất video
    const videos = extractVideos(climateVideosData)

    if (!videos || videos.length === 0) {
      return (
        <View style={styles.forecastCard}>
          <Text style={styles.forecastTitleLarge}>Video khí hậu</Text>
          <Text style={styles.description}>
            Không có video nào về khí hậu được tìm thấy.
          </Text>
        </View>
      )
    }

    // Lọc ra các video không bị ẩn
    const visibleVideos = videos.filter(
      (video) => !hiddenClimateVideos.has(video.id)
    )

    return (
      <View style={styles.forecastCard}>
        <Text style={styles.forecastTitleLarge}>Video dự báo thời tiết</Text>
        {visibleVideos.length === 0 ? (
          <Text style={styles.description}>
            Không có video nào có thể hiển thị.
          </Text>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {visibleVideos.map((video) => (
              <YouTubeVideoItem
                key={video.id}
                video={video}
                onError={() => handleClimateVideoHidden(video.id)}
              />
            ))}
          </ScrollView>
        )}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Thời Tiết</Text>

        <View style={styles.searchContainer}>
          <TouchableOpacity
            style={[styles.searchButton, styles.locationButton]}
            onPress={handleCurrentLocation}
            disabled={loading}
          >
            <Text style={styles.searchButtonText}>Vị trí hiện tại</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.searchButton, styles.refreshButton]}
            onPress={handleRefresh}
            disabled={loading}
          >
            <Text style={styles.searchButtonText}>Làm mới</Text>
          </TouchableOpacity>
          {/* <TouchableOpacity
            style={styles.searchButton}
            onPress={searchWeather}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color='white' size='small' />
            ) : (
              <Text style={styles.searchButtonText}>Tìm kiếm</Text>
            )}
          </TouchableOpacity> */}
          <TextInput
            style={styles.searchInput}
            placeholder='Nhập tên thành phố...'
            value={city}
            onChangeText={setCity}
            onSubmitEditing={() => handleSearch()}
          />
        </View>

        <View style={styles.tabContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabScrollView}
            ref={scrollViewRef}
            onLayout={() => {
              // Scroll to active tab on initial layout
              const tabIndex =
                {
                  current: 0,
                  hourly: 1,
                  forecast: 2,
                  climate: 3,
                }[activeTab] || 0
              setTimeout(() => {
                scrollToTab(tabIndex)
              }, 100)
            }}
          >
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "current" && styles.activeTab,
                styles.tabMargin,
              ]}
              onPress={() => handleTabChange("current")}
              onLayout={(e) => {
                tabRefs.current[0] = {
                  x: e.nativeEvent.layout.x,
                  width: e.nativeEvent.layout.width,
                }
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "current" && styles.activeTabText,
                ]}
              >
                Hiện tại
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "hourly" && styles.activeTab,
                styles.tabMargin,
              ]}
              onPress={() => handleTabChange("hourly")}
              onLayout={(e) => {
                tabRefs.current[1] = {
                  x: e.nativeEvent.layout.x,
                  width: e.nativeEvent.layout.width,
                }
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "hourly" && styles.activeTabText,
                ]}
              >
                Theo giờ
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "forecast" && styles.activeTab,
                styles.tabMargin,
              ]}
              onPress={() => handleTabChange("forecast")}
              onLayout={(e) => {
                tabRefs.current[2] = {
                  x: e.nativeEvent.layout.x,
                  width: e.nativeEvent.layout.width,
                }
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "forecast" && styles.activeTabText,
                ]}
              >
                Dự báo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "climate" && styles.activeTab,
                styles.tabMargin,
              ]}
              onPress={() => handleTabChange("climate")}
              onLayout={(e) => {
                tabRefs.current[3] = {
                  x: e.nativeEvent.layout.x,
                  width: e.nativeEvent.layout.width,
                }
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "climate" && styles.activeTabText,
                ]}
              >
                Khí hậu
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#4A90E2' />
          <Text style={styles.loadingText}>Đang tải dữ liệu thời tiết...</Text>
        </View>
      ) : activeTab === "current" ? (
        renderCurrentWeather()
      ) : activeTab === "hourly" ? (
        renderHourlyForecast()
      ) : activeTab === "forecast" ? (
        renderForecast()
      ) : (
        <ScrollView
          style={styles.forecastCard}
          showsVerticalScrollIndicator={false}
        >
          {renderClimateVideos()}
          {renderClimateForecast()}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f8ff",
  },
  header: {
    backgroundColor: "#4A90E2",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: "#2E7BD6",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  refreshButton: {
    backgroundColor: "#28a745",
    marginRight: 3,
  },
  locationButton: {
    backgroundColor: "#ff6b35",
    marginRight: 3,
  },
  searchButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  favoriteButton: {
    backgroundColor: "#ffc107",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginTop: 5,
  },
  favoriteText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 25,
    padding: 4,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: "center",
    borderRadius: 20,
    minWidth: 80,
  },
  activeTab: {
    backgroundColor: "white",
  },
  tabText: {
    color: "white",
    fontWeight: "600",
  },
  activeTabText: {
    color: "#4A90E2",
  },
  weatherContainer: {
    flex: 1,
    padding: 20,
  },
  currentWeatherCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  cityName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  countryName: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  mainWeatherInfo: {
    alignItems: "center",
    marginBottom: 30,
  },
  weatherIcon: {
    width: 100,
    height: 100,
  },
  temperature: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#4A90E2",
    marginTop: 10,
  },
  temperatureSmall: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#4A90E2",
    marginTop: 10,
  },
  description: {
    fontSize: 18,
    color: "#666",
    textTransform: "capitalize",
  },
  detailsContainer: {
    marginTop: 20,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  detailItem: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  forecastCard: {
    flex: 1,
    padding: 5,
  },
  forecastTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  forecastItem: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  forecastDate: {
    width: 60,
    alignItems: "center",
  },
  dayName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  dayMonth: {
    fontSize: 12,
    color: "#666",
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
    fontWeight: "bold",
    color: "#4A90E2",
  },
  forecastDescription: {
    fontSize: 14,
    color: "#666",
    textTransform: "capitalize",
  },
  forecastDetails: {
    alignItems: "flex-end",
  },
  forecastHumidity: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  forecastWind: {
    fontSize: 12,
    color: "#666",
  },
  hourlyItem: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  hourlyTime: {
    width: 80,
    alignItems: "center",
  },
  hourlyTimeText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  hourlyDateText: {
    fontSize: 12,
    color: "#666",
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
    fontWeight: "bold",
    color: "#4A90E2",
  },
  hourlyDescription: {
    fontSize: 14,
    color: "#666",
    textTransform: "capitalize",
  },
  hourlyDetails: {
    alignItems: "flex-end",
  },
  hourlyRain: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "bold",
    marginBottom: 2,
  },
  hourlyHumidity: {
    fontSize: 12,
    color: "#666",
  },
  // Styles mới cho giao diện nông dân
  hourlyItemLarge: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  hourlyTimeSection: {
    marginBottom: 15,
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 12,
  },
  hourlyTimeTextLarge: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 4,
  },
  hourlyDateTextLarge: {
    fontSize: 16,
    color: "#34495e",
    fontWeight: "600",
    textAlign: "center",
  },
  hourlyWeatherSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: "#f0f8ff",
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
    fontWeight: "bold",
    color: "#e74c3c",
    marginBottom: 4,
  },
  hourlyDescriptionLarge: {
    fontSize: 16,
    color: "#2c3e50",
    fontWeight: "500",
    textTransform: "capitalize",
  },
  hourlyDetailsSection: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  hourlyDetailItem: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  hourlyDetailLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#7f8c8d",
    marginBottom: 6,
    textAlign: "center",
  },
  hourlyRainLarge: {
    fontSize: 18,
    color: "#3498db",
    fontWeight: "bold",
    textAlign: "center",
  },
  hourlyHumidityLarge: {
    fontSize: 18,
    color: "#27ae60",
    fontWeight: "bold",
    textAlign: "center",
  },
  // Style cho khả năng mưa trung tâm
  rainCenterSection: {
    alignItems: "center",
    backgroundColor: "#e3f2fd",
    padding: 20,
    marginVertical: 15,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: "#2196f3",
    shadowColor: "#2196f3",
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
    fontWeight: "bold",
    color: "#1976d2",
    marginBottom: 8,
    textAlign: "center",
  },
  rainCenterValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#0d47a1",
    marginBottom: 8,
    textAlign: "center",
    textShadowColor: "rgba(13, 71, 161, 0.3)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  rainCenterNote: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1565c0",
    textAlign: "center",
    textTransform: "uppercase",
  },
  hourlyWindLarge: {
    fontSize: 18,
    color: "#9c27b0",
    fontWeight: "bold",
    textAlign: "center",
  },
  hourlyTemperatureSmall: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#e74c3c",
    marginBottom: 4,
  },
  // Styles cho tab Dự báo cải tiến
  forecastTitleLarge: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 20,
    textAlign: "center",
    textTransform: "uppercase",
  },
  forecastItemLarge: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  forecastDateSection: {
    marginBottom: 15,
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 12,
  },
  forecastDateTextLarge: {
    fontSize: 18,
    color: "#34495e",
    fontWeight: "600",
    textAlign: "center",
  },
  forecastWeatherSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: "#f0f8ff",
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
    fontWeight: "bold",
    color: "#e74c3c",
    marginBottom: 4,
  },
  forecastDescriptionLarge: {
    fontSize: 16,
    color: "#2c3e50",
    fontWeight: "500",
    textTransform: "capitalize",
  },
  forecastDetailsSection: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  forecastDetailItem: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  forecastDetailLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#7f8c8d",
    marginBottom: 6,
    textAlign: "center",
  },
  forecastHumidityLarge: {
    fontSize: 18,
    color: "#27ae60",
    fontWeight: "bold",
    textAlign: "center",
  },
  forecastWindLarge: {
    fontSize: 18,
    color: "#9c27b0",
    fontWeight: "bold",
    textAlign: "center",
  },
  forecastTemperatureSmall: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#e74c3c",
    marginBottom: 4,
  },
  tabScrollView: {
    flexDirection: "row",
  },
  tabMargin: {
    marginRight: 10,
  },

  // Styles cho video YouTube
  videoItem: {
    backgroundColor: "#fff",
    marginVertical: 8,
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  videoInfo: {
    flex: 1,
    marginTop: 10,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1976D2",
    marginBottom: 8,
    lineHeight: 22,
  },
  videoChannel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  videoDuration: {
    fontSize: 12,
    color: "#FF6F00",
    fontWeight: "bold",
    marginBottom: 4,
  },
  videoDate: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
  videoPlayerContainer: {
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#000",
  },

  // Styles cho khuyến nghị
  insightsContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: "#f3e5f5",
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1B5E20",
    marginBottom: 8,
  },
  insightText: {
    fontSize: 13,
    color: "#4A148C",
    marginBottom: 4,
    lineHeight: 18,
  },
})
