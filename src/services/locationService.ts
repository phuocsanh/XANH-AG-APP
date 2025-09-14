import * as Location from 'expo-location';
import { LocationGeocodedAddress } from 'expo-location';
import { terminalApiLogger } from '../utils/terminalLogger';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface LocationResult {
  success: boolean;
  coordinates?: LocationCoordinates;
  error?: string;
  cityName?: string;
}

/**
 * Request location permissions from user
 */
export const requestLocationPermissions = async (): Promise<boolean> => {
  try {
    terminalApiLogger.request('LOCATION_PERMISSION', 'Requesting location permissions', {});
    
    // Kiểm tra quyền hiện tại trước
    const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
    
    if (currentStatus === 'granted') {
      terminalApiLogger.response(200, 'LOCATION_PERMISSION', { status: currentStatus });
      return true;
    }
    
    // Nếu chưa có quyền, yêu cầu quyền mới
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      terminalApiLogger.error(new Error(`Location permission ${status}`), 'LOCATION_PERMISSION');
      return false;
    }
    
    terminalApiLogger.response(200, 'LOCATION_PERMISSION', { status });
    return true;
  } catch (error) {
    terminalApiLogger.error(error as Error, 'LOCATION_PERMISSION');
    return false;
  }
};

/**
 * Get current location coordinates
 */
export const getCurrentLocation = async (): Promise<LocationResult> => {
  try {
    terminalApiLogger.request('GET_LOCATION', 'Getting current location', {});
    
    // Check if location services are enabled
    const isLocationEnabled = await Location.hasServicesEnabledAsync();
    if (!isLocationEnabled) {
      const error = 'Location services are disabled';
      terminalApiLogger.error(new Error(error), 'GET_LOCATION');
      return {
        success: false,
        error: 'Dịch vụ định vị đã bị tắt. Vui lòng bật GPS trong cài đặt.'
      };
    }
    
    // Request permissions if not granted
    const hasPermission = await requestLocationPermissions();
    if (!hasPermission) {
      return {
        success: false,
        error: 'Không có quyền truy cập vị trí. Vui lòng cấp quyền trong cài đặt.'
      };
    }
    
    // Get current position
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 10000,
      distanceInterval: 100,
    });
    
    const coordinates: LocationCoordinates = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude
    };
    
    terminalApiLogger.response(200, 'GET_LOCATION', coordinates);
    
    return {
      success: true,
      coordinates
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    terminalApiLogger.error(error as Error, 'GET_LOCATION');
    
    return {
      success: false,
      error: `Không thể lấy vị trí hiện tại: ${errorMessage}`
    };
  }
};

/**
 * Get current location with city name using reverse geocoding
 */
export const getCurrentLocationWithCity = async (): Promise<LocationResult> => {
  try {
    console.log('LẤY_VỊ_TRÍ: Bắt đầu lấy vị trí hiện tại...');
    
    // First check if we have location permissions
    const hasPermissions = await hasLocationPermissions();
    if (!hasPermissions) {
      // Try to request permissions
      const permissionGranted = await requestLocationPermissions();
      if (!permissionGranted) {
        return {
          success: false,
          error: 'Quyền truy cập vị trí bị từ chối. Vui lòng cấp quyền trong cài đặt ứng dụng.'
        };
      }
    }

    const locationResult = await getCurrentLocation();
    
    if (!locationResult.success || !locationResult.coordinates) {
      return {
        success: false,
        error: locationResult.error || 'Không thể lấy vị trí hiện tại. Vui lòng kiểm tra GPS và thử lại.'
      };
    }
    
    terminalApiLogger.request('REVERSE_GEOCODING', 'Getting city name from coordinates', locationResult.coordinates);
    
    // Reverse geocoding to get city name
    const reverseGeocode = await Location.reverseGeocodeAsync({
      latitude: locationResult.coordinates.latitude,
      longitude: locationResult.coordinates.longitude
    });
    
    console.log('ĐỊA_CHỈ_NGƯỢC: Dữ liệu địa chỉ thô:', reverseGeocode[0]);
    
    let cityName = 'Unknown';
    if (reverseGeocode && reverseGeocode.length > 0) {
      const address = reverseGeocode[0];
      
      // Build detailed address from multiple components with priority for local areas
       const addressParts = [];
       
       // Add specific location information first (most specific)
       if (address.name && address.name !== address.city && address.name !== address.district) {
         addressParts.push(address.name);
       }
       
       // Add street information
       if (address.street && address.street !== address.name) {
         addressParts.push(address.street);
       }
       
       // Add district/administrative areas
       if (address.district) {
         addressParts.push(address.district);
       }
       
       // Add city/province
       if (address.city) {
         addressParts.push(address.city);
       }
       
       // Add region if different from city
       if (address.subregion && address.subregion !== address.city) {
         addressParts.push(address.subregion);
       } else if (address.region && address.region !== address.city) {
         addressParts.push(address.region);
       }
      
      // Tạo tên địa chỉ hoàn chỉnh
      cityName = addressParts.length > 0 ? addressParts.join(', ') : 'Unknown Location';
      
      console.log('ĐỊA_CHỈ_NGƯỢC: Tên thành phố cuối cùng:', cityName);
    console.log('ĐỊA_CHỈ_NGƯỢC: Các thành phần địa chỉ được sử dụng:', addressParts);
    console.log('ĐỊA_CHỈ_NGƯỢC: Các thuộc tính địa chỉ có sẵn:', Object.keys(address));
    }
    
    terminalApiLogger.response(200, 'REVERSE_GEOCODING', { cityName });
    
    return {
      success: true,
      coordinates: locationResult.coordinates,
      cityName
    };
  } catch (error) {
    console.error('LẤY_VỊ_TRÍ: Lỗi khi lấy vị trí:', error);
    terminalApiLogger.error(error as Error, 'REVERSE_GEOCODING');
    
    return {
      success: false,
      error: 'Có lỗi xảy ra khi lấy thông tin vị trí. Vui lòng thử lại sau.'
    };
  }
};

/**
 * Check if location permissions are granted
 */
export const hasLocationPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    terminalApiLogger.error(error as Error, 'CHECK_LOCATION_PERMISSION');
    return false;
  }
};

export default {
  requestLocationPermissions,
  getCurrentLocation,
  getCurrentLocationWithCity,
  hasLocationPermissions
};