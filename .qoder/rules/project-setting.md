---
trigger: manual
alwaysApply: false
---
- Luôn trả lời bằng tiếng việt,không bao giờ được nói tiếng anh với tôi.
- Luôn kiểm lỗi TypeScript và ESLint sau khi code xong 1 file hoặc 1 chức năng.
- Luôn xem xét cấu trúc dự án có sẵn, không nên tạo file hoặc folder mới khi không có lý do cụ thể.
- Bám sát cấu trúc dự án, không nên thay đổi cấu trúc dự án khi không có lý do cụ thể.
- Luôn tìm kiếm giải pháp tốt nhất trước khi thực hiện 1 chức năng theo yêu cầu.
- Luôn comment code bằng tiếng việt chức năng của file, hàm, code hay biến.
- Hàm, code, hay file nào sau khi thêm chức năng mới hoặc chỉnh sửa xong mà không dùng nữa thì xóa đi.
- hạy dự án bằng npm start.
Sử dụng [zustand] để quản lý trạng thái toàn cục khi cần, ưu tiên Context API cho các state cục bộ.
- Kiểm tra hiệu năng bằng React DevTools hoặc Profiler sau khi hoàn thành tính năng, tối ưu nếu phát hiện bottleneck.
- Viết test case cho các hàm hoặc component quan trọng sau khi hoàn thành, đạt độ phủ test tối thiểu 80%.
- Thêm log hoặc try-catch khi xử lý API hoặc logic phức tạp, sử dụng thư viện như Sentry nếu cần.
- Kiểm tra và debug trên cả iOS và Android sau khi hoàn thành, đảm bảo UI/UX nhất quán.
Kiểm tra phiên bản hiện tại của thư viện bằng npm outdated trước khi thêm dependency mới, ưu tiên phiên bản ổn định.
- Folder modules là của server api copy qua để tham khảo đừng sửa code hay kiểm tra lỗi của nó. Khi kiermểm tra lỗi thì bỏ qua folder modules
