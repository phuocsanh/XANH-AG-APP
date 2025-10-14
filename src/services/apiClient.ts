import axiosInstance, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios"
import { terminalApiLogger } from "../utils/terminalLogger"

// Tạo axios instance với cấu hình mặc định
const axiosClient: AxiosInstance = axiosInstance.create({
  baseURL: "http://localhost:3003",
  timeout: 10000, // 10 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor - log requests
axiosClient.interceptors.request.use(
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
axiosClient.interceptors.response.use(
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
// This axiosClientWrapper uses the configured axiosClient instance which is created with axiosInstance
// All methods explicitly delegate to the corresponding axios methods (axios.get, axios.post, etc.)
export const apiClient = {
  // Standard HTTP methods
  // GET request using axios.get internally
  get: <T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    // Explicitly using axios.get through the axiosClient instance
    return axiosClient.get<T>(url, config)
  },

  // POST request using axios.post internally
  post: <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    // Explicitly using axios.post through the axiosClient instance
    return axiosClient.post<T>(url, data, config)
  },

  // PUT request using axios.put internally
  put: <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    // Explicitly using axios.put through the axiosClient instance
    return axiosClient.put<T>(url, data, config)
  },

  // PATCH request using axios.patch internally
  patch: <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    // Explicitly using axios.patch through the axiosClient instance
    return axiosClient.patch<T>(url, data, config)
  },

  // DELETE request using axios.delete internally
  delete: <T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    // Explicitly using axios.delete through the axiosClient instance
    return axiosClient.delete<T>(url, config)
  },

  // Form data methods
  // POST form data using axios.post internally with FormData
  postFormData: <T>(
    url: string,
    data: FormData | Record<string, any>,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    const formData = data instanceof FormData ? data : objectToFormData(data)

    // Explicitly using axios.post through the axiosClient instance
    return axiosClient.post<T>(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        "Content-Type": "multipart/form-data",
      },
    })
  },

  // PUT form data using axios.put internally with FormData
  putFormData: <T>(
    url: string,
    data: FormData | Record<string, any>,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    const formData = data instanceof FormData ? data : objectToFormData(data)

    // Explicitly using axios.put through the axiosClient instance
    return axiosClient.put<T>(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        "Content-Type": "multipart/form-data",
      },
    })
  },

  // PATCH form data using axios.patch internally with FormData
  patchFormData: <T>(
    url: string,
    data: FormData | Record<string, any>,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    const formData = data instanceof FormData ? data : objectToFormData(data)

    // Explicitly using axios.patch through the axiosClient instance
    return axiosClient.patch<T>(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        "Content-Type": "multipart/form-data",
      },
    })
  },
}

// Export the axiosClientWrapper object containing all methods
// This provides a centralized API client that explicitly uses axios internally with consistent configuration
