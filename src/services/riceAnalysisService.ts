import { GoogleGenAI } from '@google/genai';

// Cấu hình Gemini API
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenAI({ apiKey: API_KEY });

// Danh sách các trang web cần phân tích
const RICE_PRICE_WEBSITES = [
  'https://congthuong.vn/chu-de/gia-lua-gao-hom-nay.topic',
  'https://thitruongluagao.com/group/1/597/thi-truong-lua-va-tien-do-san-xuat',
  'https://gaophuongnam.vn/gia-lua-gao-hom-nay'
];

// Interface cho kết quả phân tích
export interface RiceAnalysisResult {
  summary: string;
  priceData: {
    freshRice: string;
    exportRice: string;
    domesticRice: string;
    trend: 'tăng' | 'giảm' | 'ổn định';
  };
  riceVarieties: {
    variety: string;
    price: string;
    province: string;
  }[];
  marketInsights: string[];
  lastUpdated: string;
}

/**
 * Service phân tích giá lúa gạo sử dụng Gemini AI
 * AI sẽ trực tiếp truy cập và phân tích các trang web
 */
export class RiceAnalysisService {
  constructor() {
    // Không cần khởi tạo model riêng, sử dụng trực tiếp genAI
  }

  /**
   * Phân tích giá lúa gạo từ các trang web
   * @returns Promise<RiceAnalysisResult>
   */
  async analyzeRicePrices(): Promise<RiceAnalysisResult> {
    // Kiểm tra API key
    if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
      throw new Error('API key chưa được cấu hình. Vui lòng cấu hình EXPO_PUBLIC_GEMINI_API_KEY trong file .env');
    }

    const prompt = this.createAnalysisPrompt();
    
    // Sử dụng API mới của @google/genai
    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: prompt
    });
    
    const analysisText = response.text || '';

    // Parse kết quả từ AI thành structured data
    return this.parseAnalysisResult(analysisText);
  }



  /**
   * Tạo prompt cho AI để phân tích các trang web
   * @returns string
   */
  private createAnalysisPrompt(): string {
    return `
Bạn là chuyên gia phân tích thị trường lúa gạo Việt Nam. Hãy truy cập và phân tích thông tin từ các trang web sau:

${RICE_PRICE_WEBSITES.map((url, index) => `${index + 1}. ${url}`).join('\n')}

Yêu cầu phân tích chi tiết:
1. Tóm tắt tình hình giá lúa gạo hiện tại
2. Giá cụ thể của:
   - Lúa tươi (VNĐ/kg)
   - Gạo xuất khẩu (USD/tấn)
   - Gạo trong nước (VNĐ/kg)
3. Xu hướng giá (tăng/giảm/ổn định)
4. **QUAN TRỌNG**: Tìm và phân tích thông tin cụ thể về:
   - Các giống lúa được nhắc đến trong bài báo (như ST24, ST25, IR504, ĐT8, Jasmine, Nàng Hương, v.v.)
   - Giá của từng giống lúa cụ thể
   - Tỉnh thành nơi có giá đó (An Giang, Đồng Tháp, Kiên Giang, Cần Thơ, Sóc Trăng, v.v.)
   - Ví dụ: "ST25 tại Sóc Trăng: 9.200 đồng/kg", "IR504 tại An Giang: 6.900 đồng/kg"
5. Những thông tin quan trọng về thị trường
6. Nguyên nhân ảnh hưởng đến giá

Trả về kết quả theo định dạng JSON như sau:
{
  "summary": "Tóm tắt tình hình thị trường",
  "priceData": {
    "freshRice": "Giá lúa tươi",
    "exportRice": "Giá gạo xuất khẩu",
    "domesticRice": "Giá gạo trong nước",
    "trend": "tăng/giảm/ổn định"
  },
  "riceVarieties": [
    {
      "variety": "Tên giống lúa (ví dụ: ST25)",
      "price": "Giá cụ thể (ví dụ: 9.200 đồng/kg)",
      "province": "Tỉnh thành (ví dụ: Sóc Trăng)"
    }
  ],
  "marketInsights": ["Thông tin 1", "Thông tin 2", "..."],
  "lastUpdated": "Thời gian cập nhật"
}

Lưu ý: 
- Chỉ trả về JSON, không thêm text khác
- Tập trung tìm thông tin cụ thể về giống lúa và tỉnh thành từ nội dung bài báo
- Nếu không tìm thấy thông tin cụ thể, hãy sử dụng thông tin tổng quát có sẵn
    `;
  }

  /**
   * Parse kết quả phân tích từ AI
   * @param analysisText - Text response từ AI
   * @returns RiceAnalysisResult
   */
  private parseAnalysisResult(analysisText: string): RiceAnalysisResult {
    try {
      // Loại bỏ markdown formatting nếu có
      const cleanText = analysisText.replace(/```json\n?|```\n?/g, '').trim();
      const parsed = JSON.parse(cleanText);
      
      return {
        summary: parsed.summary || 'Không có thông tin tóm tắt',
        priceData: {
          freshRice: parsed.priceData?.freshRice || 'Chưa cập nhật',
          exportRice: parsed.priceData?.exportRice || 'Chưa cập nhật',
          domesticRice: parsed.priceData?.domesticRice || 'Chưa cập nhật',
          trend: parsed.priceData?.trend || 'ổn định'
        },
        riceVarieties: parsed.riceVarieties || [
          { variety: 'Đang cập nhật', price: 'Đang cập nhật', province: 'Đang cập nhật' }
        ],
        marketInsights: parsed.marketInsights || ['Không có thông tin chi tiết'],
        lastUpdated: parsed.lastUpdated || new Date().toLocaleString('vi-VN')
      };
    } catch (error) {
      console.error('Lỗi parse kết quả:', error);
      // Fallback: trả về kết quả mặc định với raw text
      return {
        summary: analysisText.substring(0, 500) + '...',
        priceData: {
          freshRice: 'Đang cập nhật',
          exportRice: 'Đang cập nhật', 
          domesticRice: 'Đang cập nhật',
          trend: 'ổn định'
        },
        riceVarieties: [
          { variety: 'Đang cập nhật', price: 'Đang cập nhật', province: 'Đang cập nhật' }
        ],
        marketInsights: ['Dữ liệu đang được xử lý'],
        lastUpdated: new Date().toLocaleString('vi-VN')
      };
    }
  }

  /**
   * Tạo nội dung text để đọc bằng text-to-speech
   * @param analysis - Kết quả phân tích
   * @returns string
   */
  generateSpeechText(analysis: RiceAnalysisResult): string {
    const speechText = `
Báo cáo thị trường lúa gạo hôm nay.

${analysis.summary}

Thông tin giá cụ thể:
Lúa tươi: ${analysis.priceData.freshRice}
Gạo xuất khẩu: ${analysis.priceData.exportRice}
Gạo trong nước: ${analysis.priceData.domesticRice}
Xu hướng thị trường: ${analysis.priceData.trend}

Các thông tin quan trọng:
${analysis.marketInsights.join('. ')}

Cập nhật lúc: ${analysis.lastUpdated}
    `;
    
    return speechText.trim();
  }
}

// Export singleton instance
export const riceAnalysisService = new RiceAnalysisService();