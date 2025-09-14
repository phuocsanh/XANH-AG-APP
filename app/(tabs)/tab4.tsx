import { View, Text, StyleSheet } from 'react-native';

// Tab thứ 4 - Placeholder
export default function Tab4Screen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tab 4</Text>
      <Text style={styles.subtitle}>Nội dung sẽ được thêm sau</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});