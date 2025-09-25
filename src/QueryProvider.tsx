import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { onlineManager, focusManager } from '@tanstack/react-query';
import { DevToolsBubble } from 'react-native-react-query-devtools';
import * as Clipboard from 'expo-clipboard';

// Tạo QueryClient với cấu hình tối ưu cho React Native
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 phút
      gcTime: 10 * 60 * 1000, // 10 phút (thay thế cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

// Thiết lập online manager cho React Native
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});

// Thiết lập focus manager cho React Native
function onAppStateChange(status: string) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

interface QueryProviderProps {
  children: React.ReactNode;
}

const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription?.remove();
  }, []);

  // Hàm copy cho DevTools - hỗ trợ Expo
  const onCopy = async (text: string): Promise<boolean> => {
    try {
      await Clipboard.setStringAsync(text);
      return true;
    } catch (error) {
      console.warn('Failed to copy to clipboard:', error);
      return false;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools chỉ hiển thị trong development mode */}
      {__DEV__ && (
        <DevToolsBubble 
          queryClient={queryClient} 
          onCopy={onCopy}
        />
      )}
    </QueryClientProvider>
  );
};

export default QueryProvider;
export { queryClient };