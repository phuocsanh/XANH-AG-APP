import { YouTubeVideo } from "../components/YouTubeVideoItem"

/**
 * Utility function để xử lý dữ liệu video từ các API khác nhau
 * Một số API trả về mảng video trực tiếp, một số khác trả về object chứa mảng video
 */

// Type guard để kiểm tra nếu dữ liệu là mảng video trực tiếp
export const isVideoArray = (data: any): data is YouTubeVideo[] => {
  return (
    Array.isArray(data) && data.length > 0 && typeof data[0].id === "string"
  )
}

// Type guard để kiểm tra nếu dữ liệu là object chứa mảng video
export const isVideoObject = (
  data: any
): data is { videos: YouTubeVideo[] } => {
  return data && typeof data === "object" && Array.isArray(data.videos)
}

// Hàm để trích xuất mảng video từ các loại dữ liệu khác nhau
export const extractVideos = (
  data: YouTubeVideo[] | { videos: YouTubeVideo[] } | undefined
): YouTubeVideo[] => {
  if (!data) return []

  if (isVideoArray(data)) {
    return data
  }

  if (isVideoObject(data)) {
    return data.videos
  }

  return []
}
