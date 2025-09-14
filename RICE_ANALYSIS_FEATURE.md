# Tính năng Phân tích Giá Lúa Gạo với AI

## Mô tả
Tính năng này sử dụng AI Gemini 2.5 Flash để tự động truy cập và phân tích thông tin giá lúa gạo từ các trang web, sau đó chuyển đổi kết quả thành giọng nói bằng text-to-speech.

## Cách sử dụng

### 1. Demo Mode
- Tính năng sẽ tự động sử dụng dữ liệu demo khi chưa cấu hình API key
- Bạn có thể trải nghiệm đầy đủ tính năng mà không cần cấu hình gì thêm

### 2. Cấu hình API Key (tùy chọn)
- Để sử dụng AI thực tế, truy cập [Google AI Studio](https://aistudio.google.com/app/apikey)
- Tạo API key mới cho Gemini
- Mở file `.env` và thay thế `your_gemini_api_key_here` bằng API key thực tế

### 3. Sử dụng tính năng
1. Mở ứng dụng và chuyển sang **Tab 2**
2. Nhấn nút **"🔍 Phân tích giá lúa gạo"**
3. Xem kết quả phân tích (demo hoặc AI thực tế) bao gồm:
   - Tóm tắt thị trường
   - Thông tin giá lúa tươi, gạo xuất khẩu, gạo trong nước
   - Xu hướng giá
   - Thông tin quan trọng khác
4. Nhấn nút **"🔊 Đọc kết quả"** để nghe AI đọc kết quả
5. Nhấn **"⏹️ Dừng đọc"** để dừng text-to-speech

## Tính năng chính

### 🤖 AI Phân tích thông minh
- Sử dụng Gemini 2.5 Flash để phân tích dữ liệu real-time
- Tự động truy cập và đọc nội dung từ các trang web giá lúa gạo
- Tóm tắt thông tin một cách thông minh và dễ hiểu

### 🔊 Text-to-Speech
- Chuyển đổi kết quả phân tích thành giọng nói tiếng Việt
- Điều khiển phát/dừng linh hoạt
- Tốc độ đọc được tối ưu cho việc nghe hiểu

### 📱 Giao diện thân thiện
- UI hiện đại, dễ sử dụng
- Hiển thị kết quả được phân loại rõ ràng
- Loading state và error handling hoàn chỉnh

## Công nghệ sử dụng
- **AI**: Google Gemini 2.5 Flash
- **Text-to-Speech**: Expo Speech
- **Web Analysis**: Gemini AI trực tiếp phân tích nội dung web
- **UI**: React Native với TypeScript

## Lưu ý
- Cần kết nối internet để sử dụng
- API key Gemini cần được cấu hình đúng
- Tính năng text-to-speech hỗ trợ tiếng Việt
- Dữ liệu được phân tích real-time từ các nguồn web