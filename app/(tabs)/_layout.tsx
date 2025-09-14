import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';

// Layout cho bottom tab navigation với 4 tabs
export default function TabLayout() {
  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false, // Ẩn header cho tất cả tabs
        tabBarActiveTintColor: '#4A90E2',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Thời tiết',
          tabBarIcon: ({ color }) => (
            <FontAwesome size={24} name="cloud" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tab2"
        options={{
          title: 'Tab 2',
          tabBarIcon: ({ color }) => (
            <FontAwesome size={24} name="home" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tab3"
        options={{
          title: 'Tab 3',
          tabBarIcon: ({ color }) => (
            <FontAwesome size={24} name="user" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tab4"
        options={{
          title: 'Tab 4',
          tabBarIcon: ({ color }) => (
            <FontAwesome size={24} name="cog" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}