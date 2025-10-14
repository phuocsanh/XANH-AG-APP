import { useQuery, UseQueryOptions } from "@tanstack/react-query"
import axios from "./apiClient"

// Interface cho dữ liệu dự báo khí hậu
export interface ClimateForecastData {
  id: number
  summary: string
  hydrologyInfo: string
  waterLevelInfo: string
  stormsAndTropicalDepressionsInfo: string
  lastUpdated: string
  dataSources: string[]
  dataQuality: {
    score: number
    reliability: string
    sourcesUsed: number
  }
  createdAt: string
  updatedAt: string
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
export const getClimateForecast = async (): Promise<ClimateForecastData> => {
  try {
    const response = await axios.get<ClimateForecastData>(
      "/weather-forecast/climate-forecasting"
    )
    return response.data
  } catch (error) {
    console.error("Error fetching climate forecast:", error)
    throw error
  }
}

export const getClimateYouTubeVideos = async (): Promise<YouTubeVideo[]> => {
  try {
    const response = await axios.get<YouTubeVideo[]>(
      "/weather-forecast/youtube-videos"
    )
    console.log("Actual YouTube API response:", response.data)
    return response.data
  } catch (error) {
    console.error("Error fetching climate YouTube videos:", error)
    throw error
  }
}

// TanStack Query hooks
export const useClimateForecast = (
  options?: Omit<
    UseQueryOptions<ClimateForecastData, Error>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery({
    queryKey: ["climate", "forecast"],
    queryFn: getClimateForecast,
    staleTime: 10 * 60 * 1000, // 10 phút
    gcTime: 30 * 60 * 1000, // 30 phút
    ...options,
  })
}

export const useClimateYouTubeVideos = (
  options?: Omit<UseQueryOptions<YouTubeVideo[], Error>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: ["climate", "youtube-videos"],
    queryFn: getClimateYouTubeVideos,
    staleTime: 15 * 60 * 1000, // 15 phút
    gcTime: 30 * 60 * 1000, // 30 phút
    ...options,
  })
}
