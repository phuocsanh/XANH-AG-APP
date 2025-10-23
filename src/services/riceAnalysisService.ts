import { useQuery, UseQueryOptions } from "@tanstack/react-query"
import { apiClient } from "./apiClient"

// Interface cho dữ liệu phân tích giá lúa gạo
export interface RiceAnalysisResult {
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

// Interface cho video YouTube - cập nhật theo cấu trúc thực tế từ API
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

// API functions
export const getRiceAnalysis = async (): Promise<RiceAnalysisResult> => {
  try {
    const response = await apiClient.get<RiceAnalysisResult>(
      "/ai-analysis/rice-market"
    )
    return response.data
  } catch (error) {
    console.error("Error fetching rice analysis:", error)
    throw error
  }
}

export const getRiceYouTubeVideos = async (): Promise<{
  videos: YouTubeVideo[]
}> => {
  try {
    const response = await apiClient.get<{ videos: YouTubeVideo[] }>(
      "/ai-analysis/youtube-videos"
    )
    return response.data
  } catch (error) {
    console.error("Error fetching rice YouTube videos:", error)
    throw error
  }
}

// TanStack Query hooks
export const useRiceAnalysis = (
  options?: Omit<
    UseQueryOptions<RiceAnalysisResult, Error>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery({
    queryKey: ["rice", "analysis"],
    queryFn: getRiceAnalysis,
    staleTime: 5 * 60 * 1000, // 5 phút
    gcTime: 10 * 60 * 1000, // 10 phút
    ...options,
  })
}

export const useRiceYouTubeVideos = (
  options?: Omit<
    UseQueryOptions<{ videos: YouTubeVideo[] }, Error>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery({
    queryKey: ["rice", "youtube-videos"],
    queryFn: getRiceYouTubeVideos,
    staleTime: 10 * 60 * 1000, // 10 phút
    gcTime: 15 * 60 * 1000, // 15 phút
    ...options,
  })
}
