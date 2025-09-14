import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Alert } from 'react-native';
import * as Location from 'expo-location';
import WeatherScreen from './screens/WeatherScreen';
import QueryProvider from './QueryProvider';
import { setupTerminalLogger } from './utils/terminalLogger';

// Setup terminal logger to show logs in Metro terminal
setupTerminalLogger();

const App: React.FC = () => {
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
      <View style={styles.container}>
        <StatusBar style="auto" />
        <WeatherScreen />
      </View>
    </QueryProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
  },
});

export default App;