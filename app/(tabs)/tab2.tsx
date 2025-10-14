import React, { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  FlatList,
  Dimensions,
  Linking,
} from "react-native"
import * as Speech from "expo-speech"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import YoutubePlayer from "react-native-youtube-iframe"

// Định nghĩa interface cho dữ liệu trả về từ API
interface RiceAnalysisResult {
  summary: string
  riceVarieties: Array<{
    name: string
    province: string
    price: string
  }>
  marketInsights: string[]
  lastUpdated: string
  dataQuality: string
  sourceUrl: string
}

// Interface cho YouTube video từ API
interface YouTubeVideo {
  id: string
  title: string
  url: string
  thumbnail: string
  channel: {
    name: string
  }
  duration: string
  isLive?: boolean
}

// Hàm gọi API để lấy dữ liệu phân tích giá lúa gạo
const fetchRiceAnalysis = async (): Promise<RiceAnalysisResult> => {
  const response = await axios.get(
    "http://localhost:3003/ai-analysis/rice-market"
  )
  return response.data
}

// Hàm gọi API để lấy YouTube videos
const fetchYouTubeVideos = async (): Promise<YouTubeVideo[]> => {
  const response = await axios.get(
    "http://localhost:3003/ai-analysis/youtube-videos",
    {
      params: {
        query: "gia lua gao",
        limit: 5,
      },
    }
  )
  return response.data // API trả về trực tiếp một mảng video
}

// Component hiển thị từng video YouTube với video nhúng trực tiếp
const YouTubeVideoItem = ({ video }: { video: YouTubeVideo }) => {
  // Hàm lấy video ID từ URL YouTube
  const getVideoId = (url: string): string => {
    const videoIdMatch = url.match(
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    )
    return videoIdMatch ? videoIdMatch[1] : ""
  }

  // Hàm mở video YouTube trong trình duyệt
  const openInYouTube = async () => {
    try {
      const supported = await Linking.canOpenURL(video.url)
      if (supported) {
        await Linking.openURL(video.url)
      } else {
        Alert.alert("Lỗi", "Không thể mở video này")
      }
    } catch (error) {
      Alert.alert("Lỗi", "Có lỗi xảy ra khi mở video")
    }
  }

  return (
    <View style={styles.videoItem}>
      {/* Thông tin video */}
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>
          {video.title}
        </Text>
        <Text style={styles.videoChannel} numberOfLines={1}>
          Kênh: {video.channel.name}
        </Text>
        <Text style={styles.videoDuration}>Thời lượng: {video.duration}</Text>
        {video.isLive && (
          <Text
            style={[styles.videoDate, { color: "#FF0000", fontWeight: "bold" }]}
          >
            🔴 LIVE
          </Text>
        )}
      </View>

      {/* Video YouTube nhúng trực tiếp */}
      <View style={styles.videoPlayerContainer}>
        <YoutubePlayer
          height={200}
          videoId={getVideoId(video.url)}
          onError={(e: any) => console.error("Lỗi tải video:", e)}
        />
      </View>

      {/* Nút mở trong YouTube (tùy chọn) */}
      <TouchableOpacity
        style={styles.openYouTubeButton}
        onPress={openInYouTube}
      >
        <Text style={styles.openYouTubeButtonText}>Mở trong YouTube</Text>
      </TouchableOpacity>
    </View>
  )
}

// Tab thứ 2 - Phân tích giá lúa gạo với AI và YouTube videos
export default function Tab2Screen() {
  const [isSpeaking, setIsSpeaking] = useState(false)

  // Sử dụng TanStack Query để tự động gọi API phân tích giá lúa gạo khi vào tab
  const {
    data: analysisResult,
    isLoading: isAnalyzing,
    error,
    refetch: handleAnalyzeRicePrices,
  } = useQuery({
    queryKey: ["riceAnalysis"],
    queryFn: fetchRiceAnalysis,
    retry: 2, // Thử lại 2 lần nếu lỗi
    staleTime: 5 * 60 * 1000, // Dữ liệu được coi là fresh trong 5 phút
    gcTime: 10 * 60 * 1000, // Cache trong 10 phút
  })

  // Sử dụng TanStack Query để tự động gọi API YouTube videos khi vào tab
  const {
    data: youtubeVideos,
    isLoading: isLoadingVideos,
    error: videosError,
    refetch: handleLoadVideos,
  } = useQuery({
    queryKey: ["youtubeVideos"],
    queryFn: fetchYouTubeVideos,
    retry: 2,
    staleTime: 10 * 60 * 1000, // Cache 10 phút
    gcTime: 15 * 60 * 1000,
  })

  // Debug log khi có dữ liệu
  React.useEffect(() => {
    if (youtubeVideos) {
      console.log("YouTube Videos loaded:", youtubeVideos)
    }
    if (videosError) {
      console.log("YouTube Videos error:", videosError)
    }
  }, [youtubeVideos, videosError])

  // Hàm text-to-speech
  const handleTextToSpeech = async () => {
    if (!analysisResult) {
      Alert.alert(
        "Thông báo",
        "Vui lòng phân tích dữ liệu trước khi sử dụng text-to-speech."
      )
      return
    }

    try {
      setIsSpeaking(true)
      // Tạo text để đọc từ dữ liệu phân tích
      const speechText = `
        Tóm tắt thị trường: ${analysisResult.summary}
        
        Thông tin quan trọng: ${analysisResult.marketInsights.join(". ")}
      `

      await Speech.speak(speechText, {
        language: "vi-VN",
        pitch: 1.0,
        rate: 0.8,
        onDone: () => setIsSpeaking(false),
        onError: () => {
          setIsSpeaking(false)
          Alert.alert("Lỗi", "Không thể phát âm thanh.")
        },
      })
    } catch (error) {
      setIsSpeaking(false)
      Alert.alert("Lỗi", "Không thể sử dụng text-to-speech.")
    }
  }

  // Hàm xử lý khi nhấn nút phân tích
  const handleAnalyzeButtonPress = () => {
    handleAnalyzeRicePrices()
  }

  // Hiển thị lỗi nếu có
  if (error) {
    Alert.alert(
      "Lỗi",
      "Không thể phân tích dữ liệu giá lúa gạo. Vui lòng thử lại."
    )
    console.error("Lỗi phân tích:", error)
  }

  // Hàm dừng text-to-speech
  const handleStopSpeech = () => {
    Speech.stop()
    setIsSpeaking(false)
  }

  // Render thông tin giá
  const renderPriceInfo = () => {
    if (!analysisResult) return null

    return (
      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle}>Kết quả phân tích</Text>

        {/* Tóm tắt */}
        <View style={styles.summaryContainer}>
          <Text style={styles.sectionTitle}>Tóm tắt thị trường:</Text>
          <Text style={styles.summaryText}>{analysisResult.summary}</Text>
        </View>

        {/* Thông tin giống lúa theo tỉnh */}
        <View style={styles.varietiesContainer}>
          <Text style={styles.sectionTitle}>Giá theo giống lúa và tỉnh:</Text>
          {analysisResult.riceVarieties.map((item, index) => (
            <View key={index} style={styles.varietyRow}>
              <View style={styles.varietyInfo}>
                <Text style={styles.varietyName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.varietyProvince} numberOfLines={1}>
                  {item.province}
                </Text>
              </View>
              <Text style={styles.varietyPrice} numberOfLines={1}>
                {item.price}
              </Text>
            </View>
          ))}
        </View>

        {/* Thông tin chi tiết */}
        <View style={styles.insightsContainer}>
          <Text style={styles.sectionTitle}>Thông tin quan trọng:</Text>
          {analysisResult.marketInsights.map((insight, index) => (
            <Text key={index} style={styles.insightText}>
              • {insight}
            </Text>
          ))}
        </View>

        {/* Thời gian cập nhật */}
        <Text style={styles.updateTime}>
          Cập nhật: {analysisResult.lastUpdated}
        </Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Phân tích giá lúa gạo</Text>
        <Text style={styles.subtitle}>Thông tin thị trường cập nhật</Text>
      </View>

      {/* Hiển thị danh sách video YouTube */}
      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle}>Video YouTube về giá lúa gạo</Text>

        {isLoadingVideos && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size='large' color='#D32F2F' />
            <Text
              style={[styles.buttonText, { color: "#666", marginLeft: 10 }]}
            >
              Đang tải video...
            </Text>
          </View>
        )}

        {videosError && (
          <Text style={[styles.summaryText, { color: "#D32F2F" }]}>
            Không thể tải video. Vui lòng thử lại sau.
          </Text>
        )}

        {youtubeVideos && youtubeVideos.length > 0 && (
          <FlatList
            data={youtubeVideos}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <YouTubeVideoItem video={item} />}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        )}

        {youtubeVideos && youtubeVideos.length === 0 && !isLoadingVideos && (
          <Text style={styles.summaryText}>
            Không tìm thấy video nào về chủ đề này.
          </Text>
        )}
      </View>
      {/* Nút phân tích */}
      <TouchableOpacity
        style={[styles.analyzeButton, isAnalyzing && styles.buttonDisabled]}
        onPress={() => handleAnalyzeRicePrices()}
        disabled={isAnalyzing}
      >
        <View style={styles.loadingContainer}>
          {isAnalyzing && <ActivityIndicator size='small' color='#fff' />}
          <Text style={styles.buttonText}>
            {isAnalyzing ? "Đang phân tích..." : "Phân tích giá lúa gạo"}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Hiển thị lỗi nếu có */}
      {error && (
        <View style={styles.resultContainer}>
          <Text style={[styles.resultTitle, { color: "#D32F2F" }]}>Lỗi</Text>
          <Text style={styles.summaryText}>
            Không thể tải dữ liệu. Vui lòng thử lại sau.
          </Text>
        </View>
      )}

      {/* Hiển thị kết quả phân tích */}
      {renderPriceInfo()}

      {/* Text-to-Speech */}
      {analysisResult && (
        <View style={styles.speechContainer}>
          <TouchableOpacity
            style={[styles.speechButton, isSpeaking && styles.speakingButton]}
            onPress={isSpeaking ? handleStopSpeech : handleTextToSpeech}
          >
            <Text style={styles.speechButtonText}>
              {isSpeaking ? "Dừng đọc" : "Đọc kết quả"}
            </Text>
          </TouchableOpacity>
          <Text style={styles.speechNote}>
            Nhấn để nghe tóm tắt kết quả phân tích
          </Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    padding: 20,
    backgroundColor: "#4A90E2",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#e3f2fd",
  },
  analyzeButton: {
    backgroundColor: "#2E7D32",
    margin: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonDisabled: {
    backgroundColor: "#9E9E9E",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  resultContainer: {
    margin: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 15,
    textAlign: "center",
  },
  summaryContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#e8f5e8",
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1B5E20",
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: "#2E7D32",
    lineHeight: 20,
  },
  varietiesContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#e1f5fe",
    borderRadius: 8,
  },
  varietyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
    backgroundColor: "#fff",
    borderRadius: 6,
    elevation: 1,
  },
  varietyInfo: {
    flex: 1,
    marginRight: 10,
  },
  varietyName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0277BD",
    marginBottom: 2,
  },
  varietyProvince: {
    fontSize: 12,
    color: "#0288D1",
    fontStyle: "italic",
  },
  varietyPrice: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#D84315",
    textAlign: "right",
    minWidth: 80,
  },
  insightsContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#f3e5f5",
    borderRadius: 8,
  },
  insightText: {
    fontSize: 13,
    color: "#4A148C",
    marginBottom: 4,
    lineHeight: 18,
  },
  updateTime: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
  speechContainer: {
    margin: 20,
    alignItems: "center",
  },
  speechButton: {
    backgroundColor: "#FF6F00",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  speakingButton: {
    backgroundColor: "#D32F2F",
  },
  speechButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  speechNote: {
    fontSize: 12,
    color: "#666",
    marginTop: 10,
    textAlign: "center",
    fontStyle: "italic",
  },
  // Styles cho YouTube videos
  videoItem: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
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
  // Styles cho video buttons
  videoButtonsContainer: {
    flexDirection: "row",
    marginTop: 10,
    gap: 10,
  },
  videoButton: {
    flex: 1,
    backgroundColor: "#1976D2",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  videoButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  videoPlayerContainer: {
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  openYouTubeButton: {
    backgroundColor: "#FF0000",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 8,
  },
  openYouTubeButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },

  // Styles cho modal
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#4A90E2",
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginRight: 15,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalInfo: {
    padding: 20,
  },
  modalChannelText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  modalDurationText: {
    fontSize: 14,
    color: "#FF6F00",
    fontWeight: "bold",
    marginBottom: 8,
  },
  modalLiveText: {
    fontSize: 14,
    color: "#D32F2F",
    fontWeight: "bold",
  },
})
