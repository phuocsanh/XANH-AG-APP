import React, { useState } from "react"
import { View, Text, StyleSheet } from "react-native"
import YoutubePlayer from "react-native-youtube-iframe"

// Interface cho video YouTube - interface chung cho cả hai loại API
export interface YouTubeVideo {
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

// Props cho component
interface YouTubeVideoItemProps {
  video: YouTubeVideo
  onError?: () => void // Callback khi video có lỗi
}

// Component hiển thị video YouTube
const YouTubeVideoItem: React.FC<YouTubeVideoItemProps> = ({
  video,
  onError,
}) => {
  // Hàm lấy video ID từ URL YouTube
  const getVideoId = (url: string): string => {
    const videoIdMatch = url.match(
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    )
    return videoIdMatch ? videoIdMatch[1] : ""
  }

  // State để theo dõi lỗi player
  const [playerError, setPlayerError] = useState<string | null>(null)

  // Xử lý lỗi player
  const handlePlayerError = (error: any) => {
    console.error("Lỗi tải video:", error)
    setPlayerError("embed_not_allowed")
    // Gọi callback onError nếu được cung cấp
    if (onError) {
      onError()
    }
  }

  // Nếu có lỗi embed, không hiển thị gì cả
  if (playerError === "embed_not_allowed") {
    return null
  }

  return (
    <View style={styles.videoItem}>
      {/* Video YouTube nhúng trực tiếp */}
      <View style={styles.videoPlayerContainer}>
        <YoutubePlayer
          height={200}
          videoId={getVideoId(video.url)}
          onError={handlePlayerError}
        />
      </View>

      {/* Thông tin video */}
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>
          {video.title}
        </Text>
        <Text style={styles.videoChannel} numberOfLines={1}>
          Kênh: {video.channel.name}
        </Text>
        <Text style={styles.videoDuration}>Thời lượng: {video.duration}</Text>
        {video.uploadTime && video.uploadTime !== "Không rõ" && (
          <Text style={styles.videoDate}>Đăng tải: {video.uploadTime}</Text>
        )}
        {video.views && video.views !== "Không rõ" && (
          <Text style={styles.videoDate}>Lượt xem: {video.views}</Text>
        )}
        {video.isLive && (
          <Text
            style={[styles.videoDate, { color: "#FF0000", fontWeight: "bold" }]}
          >
            🔴 LIVE
          </Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
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
})

export default YouTubeVideoItem
