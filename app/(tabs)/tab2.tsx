import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert
} from 'react-native';
import * as Speech from 'expo-speech';
import { riceAnalysisService, RiceAnalysisResult } from '../../src/services/riceAnalysisService';

// Tab thứ 2 - Phân tích giá lúa gạo với AI
export default function Tab2Screen() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<RiceAnalysisResult | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Tự động chạy phân tích khi component mount
  useEffect(() => {
    handleAnalyzeRicePrices();
  }, []);

  // Hàm phân tích giá lúa gạo
  const handleAnalyzeRicePrices = async () => {
    try {
      setIsAnalyzing(true);
      const result = await riceAnalysisService.analyzeRicePrices();
      setAnalysisResult(result);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể phân tích dữ liệu giá lúa gạo. Vui lòng thử lại.');
      console.error('Lỗi phân tích:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Hàm text-to-speech
  const handleTextToSpeech = async () => {
    if (!analysisResult) {
      Alert.alert('Thông báo', 'Vui lòng phân tích dữ liệu trước khi sử dụng text-to-speech.');
      return;
    }

    try {
      setIsSpeaking(true);
      const speechText = riceAnalysisService.generateSpeechText(analysisResult);
      
      await Speech.speak(speechText, {
        language: 'vi-VN',
        pitch: 1.0,
        rate: 0.8,
        onDone: () => setIsSpeaking(false),
        onError: () => {
          setIsSpeaking(false);
          Alert.alert('Lỗi', 'Không thể phát âm thanh.');
        }
      });
    } catch (error) {
      setIsSpeaking(false);
      Alert.alert('Lỗi', 'Không thể sử dụng text-to-speech.');
    }
  };

  // Hàm dừng text-to-speech
  const handleStopSpeech = () => {
    Speech.stop();
    setIsSpeaking(false);
  };

  // Render thông tin giá
  const renderPriceInfo = () => {
    if (!analysisResult) return null;

    return (
      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle}>Kết quả phân tích</Text>
        
        {/* Tóm tắt */}
        <View style={styles.summaryContainer}>
          <Text style={styles.sectionTitle}>Tóm tắt thị trường:</Text>
          <Text style={styles.summaryText}>{analysisResult.summary}</Text>
        </View>

        {/* Thông tin giá */}
        <View style={styles.priceContainer}>
          <Text style={styles.sectionTitle}>Thông tin giá:</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Lúa tươi:</Text>
            <Text style={styles.priceValue}>{analysisResult.priceData.freshRice}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Gạo xuất khẩu:</Text>
            <Text style={styles.priceValue}>{analysisResult.priceData.exportRice}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Gạo trong nước:</Text>
            <Text style={styles.priceValue}>{analysisResult.priceData.domesticRice}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Xu hướng:</Text>
            <Text style={[styles.priceValue, styles.trendText]}>
              {analysisResult.priceData.trend}
            </Text>
          </View>
        </View>

        {/* Thông tin giống lúa theo tỉnh */}
        <View style={styles.varietiesContainer}>
          <Text style={styles.sectionTitle}>Giá theo giống lúa và tỉnh:</Text>
          {analysisResult.riceVarieties.map((item, index) => (
            <View key={index} style={styles.varietyRow}>
              <View style={styles.varietyInfo}>
                <Text style={styles.varietyName} numberOfLines={1}>{item.variety}</Text>
                <Text style={styles.varietyProvince} numberOfLines={1}>{item.province}</Text>
              </View>
              <Text style={styles.varietyPrice} numberOfLines={1}>{item.price}</Text>
            </View>
          ))}
        </View>

        {/* Thông tin chi tiết */}
        <View style={styles.insightsContainer}>
          <Text style={styles.sectionTitle}>Thông tin quan trọng:</Text>
          {analysisResult.marketInsights.map((insight, index) => (
            <Text key={index} style={styles.insightText} numberOfLines={2}>• {insight}</Text>
          ))}
        </View>

        {/* Thời gian cập nhật */}
        <Text style={styles.updateTime}>Cập nhật: {analysisResult.lastUpdated}</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Phân tích giá lúa gạo</Text>
        <Text style={styles.subtitle}>Sử dụng AI Gemini 2.5 Flash</Text>
      </View>

      {/* Nút phân tích */}
      <TouchableOpacity 
        style={[styles.analyzeButton, isAnalyzing && styles.buttonDisabled]}
        onPress={handleAnalyzeRicePrices}
        disabled={isAnalyzing}
      >
        {isAnalyzing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.buttonText}>Đang phân tích...</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>🔍 Phân tích giá lúa gạo</Text>
        )}
      </TouchableOpacity>

      {/* Kết quả phân tích */}
      {renderPriceInfo()}

      {/* Nút Text-to-Speech */}
      {analysisResult && (
        <View style={styles.speechContainer}>
          <TouchableOpacity 
            style={[styles.speechButton, isSpeaking && styles.speakingButton]}
            onPress={isSpeaking ? handleStopSpeech : handleTextToSpeech}
          >
            <Text style={styles.speechButtonText}>
              {isSpeaking ? '⏹️ Dừng đọc' : '🔊 Đọc kết quả'}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.speechNote}>
            💡 Nhấn nút để nghe AI đọc kết quả phân tích
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#e3f2fd',
  },
  analyzeButton: {
    backgroundColor: '#2E7D32',
    margin: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonDisabled: {
    backgroundColor: '#9E9E9E',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  resultContainer: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 15,
    textAlign: 'center',
  },
  summaryContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#2E7D32',
    lineHeight: 20,
  },
  priceContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#fff3e0',
    borderRadius: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
    flexWrap: 'wrap',
  },
  priceLabel: {
    fontSize: 14,
    color: '#E65100',
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  priceValue: {
    fontSize: 14,
    color: '#BF360C',
    fontWeight: 'bold',
    textAlign: 'right',
    flexShrink: 0,
    maxWidth: '60%',
  },
  trendText: {
    textTransform: 'uppercase',
  },
  varietiesContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#e1f5fe',
    borderRadius: 8,
  },
  varietyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
    backgroundColor: '#fff',
    borderRadius: 6,
    elevation: 1,
  },
  varietyInfo: {
    flex: 1,
    marginRight: 10,
  },
  varietyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0277BD',
    marginBottom: 2,
  },
  varietyProvince: {
    fontSize: 12,
    color: '#0288D1',
    fontStyle: 'italic',
  },
  varietyPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#D84315',
    textAlign: 'right',
    minWidth: 80,
  },
  insightsContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f3e5f5',
    borderRadius: 8,
  },
  insightText: {
    fontSize: 13,
    color: '#4A148C',
    marginBottom: 4,
    lineHeight: 18,
  },
  updateTime: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  speechContainer: {
    margin: 20,
    alignItems: 'center',
  },
  speechButton: {
    backgroundColor: '#FF6F00',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  speakingButton: {
    backgroundColor: '#D32F2F',
  },
  speechButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  speechNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});