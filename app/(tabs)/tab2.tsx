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
// Use the centralized API client which explicitly uses axios methods internally
// This ensures consistent request handling, interceptors, and error logging
// All methods (get, post, etc.) are wrappers that call the corresponding axios methods
import YoutubePlayer from "react-native-youtube-iframe"
import YouTubeVideoItem from "@/src/components/YouTubeVideoItem"
import { extractVideos } from "@/src/utils/videoUtils"
import {
  useRiceAnalysis,
  useRiceYouTubeVideos,
} from "@/src/services/riceAnalysisService"

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
  description: string
  duration: string
  uploadTime: string
  views: string
  isLive?: boolean
}

// Tab thứ 2 - Phân tích giá lúa gạo với AI và YouTube videos
export default function Tab2Screen() {
  const [isSpeaking, setIsSpeaking] = useState(false)

  // State để theo dõi số lượng video bị ẩn
  const [hiddenVideos, setHiddenVideos] = React.useState<Set<string>>(new Set())

  // Hàm xử lý khi video bị ẩn
  const handleVideoHidden = React.useCallback((videoId: string) => {
    setHiddenVideos((prev) => new Set(prev).add(videoId))
  }, [])

  // Sử dụng TanStack Query để tự động gọi API phân tích giá lúa gạo khi vào tab
  const {
    data: analysisResult,
    isLoading: isAnalyzing,
    error,
    refetch: handleAnalyzeRicePrices,
  } = useRiceAnalysis({
    retry: 2, // Thử lại 2 lần nếu lỗi
    staleTime: 5 * 60 * 1000, // Dữ liệu được coi là fresh trong 5 phút
    gcTime: 10 * 60 * 1000, // Cache trong 10 phút
  })

  // Sử dụng TanStack Query để tự động gọi API YouTube videos khi vào tab
  const {
    data: youtubeVideosData,
    isLoading: isLoadingVideos,
    error: videosError,
    refetch: handleLoadVideos,
  } = useRiceYouTubeVideos({
    retry: 2,
    staleTime: 10 * 60 * 1000, // Cache 10 phút
    gcTime: 15 * 60 * 1000,
  })

  // Extract videos array from the response

  // Debug log khi có dữ liệu
  React.useEffect(() => {
    if (youtubeVideosData) {
      console.log("YouTube Videos loaded:", extractVideos(youtubeVideosData))
    }
    if (videosError) {
      console.log("YouTube Videos error:", videosError)
    }
  }, [youtubeVideosData, videosError])

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

        {youtubeVideosData &&
          (() => {
            const videos = extractVideos(youtubeVideosData)
            // Lọc ra các video không bị ẩn
            const visibleVideos = videos.filter(
              (video) => !hiddenVideos.has(video.id)
            )

            return (
              <>
                {visibleVideos.length === 0 && !isLoadingVideos ? (
                  <Text style={styles.summaryText}>
                    Không tìm thấy video nào về chủ đề này.
                  </Text>
                ) : (
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {visibleVideos.map((video) => (
                      <YouTubeVideoItem
                        key={video.id}
                        video={video}
                        onError={() => handleVideoHidden(video.id)}
                      />
                    ))}
                  </ScrollView>
                )}
              </>
            )
          })()}
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
