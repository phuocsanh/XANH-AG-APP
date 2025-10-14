import axiosInstance, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios"
import { terminalApiLogger } from "../utils/terminalLogger"

// Tạo axios instance với cấu hình mặc định
const apiClient: AxiosInstance = axiosInstance.create({
  baseURL: "http://localhost:3003",
  timeout: 10000, // 10 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor - log requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    terminalApiLogger.request(
      config.method?.toUpperCase() || "GET",
      `${config.baseURL}${config.url}`,
      config.params
    )
    return config
  },
  (error) => {
    terminalApiLogger.error(error, error.config?.url)
    return Promise.reject(error)
  }
)

// Response interceptor - log responses
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    terminalApiLogger.response(
      response.status,
      response.config.url || "unknown",
      response.data
    )
    return response
  },
  (error) => {
    terminalApiLogger.error(error, error.config?.url)

    // Xử lý các lỗi mạng hoặc timeout
    if (error.code === "ECONNABORTED" || error.code === "ENOTFOUND") {
      console.error("Lỗi kết nối mạng hoặc timeout")
    }

    return Promise.reject(error)
  }
)

// Utility function to convert object to FormData
export const objectToFormData = (obj: Record<string, any>): FormData => {
  const formData = new FormData()

  Object.keys(obj).forEach((key) => {
    const value = obj[key]

    if (value instanceof File || value instanceof Blob) {
      formData.append(key, value)
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        formData.append(`${key}[${index}]`, item)
      })
    } else if (typeof value === "object" && value !== null) {
      formData.append(key, JSON.stringify(value))
    } else {
      formData.append(key, String(value))
    }
  })

  return formData
}

// Core HTTP methods
const axios = {
  // Standard HTTP methods
  get: <T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return apiClient.get<T>(url, config)
  },

  post: <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return apiClient.post<T>(url, data, config)
  },

  put: <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return apiClient.put<T>(url, data, config)
  },

  patch: <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return apiClient.patch<T>(url, data, config)
  },

  delete: <T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return apiClient.delete<T>(url, config)
  },

  // Form data methods
  postFormData: <T>(
    url: string,
    data: FormData | Record<string, any>,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    const formData = data instanceof FormData ? data : objectToFormData(data)

    return apiClient.post<T>(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        "Content-Type": "multipart/form-data",
      },
    })
  },

  putFormData: <T>(
    url: string,
    data: FormData | Record<string, any>,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    const formData = data instanceof FormData ? data : objectToFormData(data)

    return apiClient.put<T>(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        "Content-Type": "multipart/form-data",
      },
    })
  },

  patchFormData: <T>(
    url: string,
    data: FormData | Record<string, any>,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    const formData = data instanceof FormData ? data : objectToFormData(data)

    return apiClient.patch<T>(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        "Content-Type": "multipart/form-data",
      },
    })
  },
}

// Export the axios object containing all methods
export default axios

// Also export individual methods for backward compatibility
export const {
  get,
  post,
  put,
  patch,
  delete: del,
  postFormData,
  putFormData,
  patchFormData,
} = axios
