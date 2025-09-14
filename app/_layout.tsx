import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import { Stack } from 'expo-router';
import QueryProvider from '../src/QueryProvider';
import { setupTerminalLogger } from '../src/utils/terminalLogger';

// Setup terminal logger để hiển thị logs trong Metro terminal
setupTerminalLogger();

// Root layout cho toàn bộ ứng dụng
export default function RootLayout() {
  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        console.log('🔍 Đang xin quyền truy cập vị trí...');
        
        // Kiểm tra quyền hiện tại
        const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
        
        if (existingStatus !== 'granted') {
          console.log('📍 Chưa có quyền vị trí, đang yêu cầu...');
          
          // Yêu cầu quyền vị trí
          const { status } = await Location.requestForegroundPermissionsAsync();
          
          if (status === 'granted') {
            console.log('✅ Đã cấp quyền truy cập vị trí');
          } else {
            console.log('❌ Người dùng từ chối cấp quyền vị trí');
            Alert.alert(
              'Quyền truy cập vị trí',
              'Ứng dụng cần quyền truy cập vị trí để hiển thị thời tiết tại vị trí hiện tại của bạn.',
              [{ text: 'OK' }]
            );
          }
        } else {
          console.log('✅ Đã có quyền truy cập vị trí');
        }
      } catch (error) {
        console.error('❌ Lỗi khi xin quyền vị trí:', error);
      }
    };

    requestLocationPermission();
  }, []);

  return (
    <QueryProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </QueryProvider>
  );
}