import React from "react"
import {
  View,
  Text,
  Image,
  StyleSheet,
} from "react-native"

// Interface cho dữ liệu thời tiết
interface WeatherItemData {
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

// Interface cho thông tin mưa
interface RainInfo {
  color: string
  backgroundColor: string
  borderColor: string
  icon: string
  description: string
}

// Interface cho dữ liệu thời tiết hiện tại
interface CurrentWeatherData {
  main: {
    temp: number
    feels_like: number
    humidity: number
    pressure: number
  }
  weather: Array<{
    icon: string
    description: string
  }>
  wind?: {
    speed: number
  }
  visibility?: number
  name: string
  sys?: {
    country: string
  }
}

// Props cho component WeatherItem
interface WeatherItemProps {
  item: WeatherItemData
  getRainInfo: (probability: number) => RainInfo
  translateWeatherDescription: (description: string) => string
  tabType?: 'current' | 'hourly' | 'forecast' // Loại tab để hiển thị thời gian khác nhau
}

/**
 * Component WeatherItem dùng chung cho cả tab Theo giờ, Dự báo và Hiện tại
 * Hiển thị thông tin thời tiết với layout thống nhất
 */
const WeatherItem: React.FC<WeatherItemProps> = ({
  item,
  getRainInfo,
  translateWeatherDescription,
  tabType = 'hourly',
}) => {
  if (!item) return null
  
  const date = new Date(item.dt * 1000)
  
  // Logic hiển thị thời gian khác nhau cho từng tab
  const getTimeDisplay = () => {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Ho_Chi_Minh',
    }
    
    switch (tabType) {
      case 'current':
        // Tab Hiện tại: Giờ + Thứ ngày tháng năm
        const timeStr = date.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
        const dateWithDayStr = date.toLocaleDateString("vi-VN", {
          weekday: "long",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
        return { primary: timeStr, secondary: dateWithDayStr }
        
      case 'hourly':
        // Tab Theo giờ: Giờ + Thứ ngày tháng năm (thứ đầy đủ)
        const hourStr = date.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
        const dayDateStr = date.toLocaleDateString("vi-VN", {
          weekday: "long",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
        return { primary: hourStr, secondary: dayDateStr }
        
      case 'forecast':
        // Tab Dự báo: Thứ + Ngày tháng năm
        const weekdayStr = date.toLocaleDateString("vi-VN", {
          weekday: "long",
        })
        const fullDateStr = date.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
        return { primary: weekdayStr, secondary: fullDateStr }
        
      default:
        const defaultTimeStr = date.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
        return { primary: defaultTimeStr, secondary: '' }
    }
  }
  
  const timeDisplay = getTimeDisplay()

  const temperature = Math.round(item.main.temp)
  const rainProbability = Math.round((item.pop || 0) * 100)
  const rainInfo = getRainInfo(rainProbability)

  return (
    <View style={styles.itemContainer}>
      {/* Phần thời gian */}
      <View style={styles.timeSection}>
        <Text style={styles.primaryTime}>{timeDisplay.primary}</Text>
        {timeDisplay.secondary && (
          <Text style={styles.secondaryTime}>{timeDisplay.secondary}</Text>
        )}
      </View>

      {/* Khả năng mưa - Trung tâm và nổi bật */}
      <View
        style={[
          styles.rainCenterSection,
          {
            backgroundColor: rainInfo.backgroundColor,
            borderColor: rainInfo.borderColor,
          },
        ]}
      >
        <Text style={[styles.rainCenterLabel, { color: rainInfo.color }]}>
          KHẢ NĂNG MƯA
        </Text>
        <Text style={[styles.rainCenterValue, { color: rainInfo.color }]}>
          {rainInfo.icon} {rainProbability}%
        </Text>
        <Text style={styles.temperatureSmall}>
          {temperature}°
        </Text>
        <Text style={styles.descriptionLarge}>
          {translateWeatherDescription(item.weather[0].description)}
        </Text>
      </View>

      {/* Thông tin chi tiết */}
      <View style={styles.detailsSection}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>ĐỘ ẨM</Text>
          <Text style={styles.humidityLarge}>
            💧 {item.main.humidity}%
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>GIÓ</Text>
          <Text style={styles.windLarge}>
            💨 {item.wind?.speed || 0} m/s
          </Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  itemContainer: {
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
  // Styles cho tab Hiện tại
  locationContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  cityName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    textAlign: "center",
  },
  countryName: {
    fontSize: 16,
    color: "#34495e",
    marginTop: 4,
  },
  favoriteButton: {
    fontSize: 14,
    color: "#4A90E2",
    marginTop: 8,
    padding: 8,
  },
  mainWeatherInfo: {
    alignItems: "center",
    marginBottom: 16,
  },
  detailsContainer: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
  },
  // Styles cho tab Theo giờ và Dự báo
  timeSection: {
    marginBottom: 15,
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 12,
  },
  primaryTime: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 4,
  },
  secondaryTime: {
    fontSize: 16,
    color: "#34495e",
    fontWeight: "600",
    textAlign: "center",
  },
  weatherSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: "#f0f8ff",
    padding: 15,
    borderRadius: 12,
  },
  weatherIcon: {
    width: 70,
    height: 70,
    marginRight: 15,
  },
  tempSection: {
    flex: 1,
  },
  temperatureSmall: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#e74c3c",
    marginBottom: 4,
  },
  descriptionLarge: {
    fontSize: 16,
    color: "#2c3e50",
    fontWeight: "500",
    textTransform: "capitalize",
  },
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
  detailsSection: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailItem: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#7f8c8d",
    marginBottom: 6,
    textAlign: "center",
  },
  humidityLarge: {
    fontSize: 18,
    color: "#27ae60",
    fontWeight: "bold",
    textAlign: "center",
  },
  windLarge: {
    fontSize: 18,
    color: "#9c27b0",
    fontWeight: "bold",
    textAlign: "center",
  },
})

export default WeatherItem