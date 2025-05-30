import { DefaultTheme } from "react-native-paper";


export const theme = {
    ...DefaultTheme,
    color: {
        ...DefaultTheme.colors,
        // primary: "#00BCD4",       // Xanh cyan tươi – chủ đạo, tạo cảm giác trong lành và năng động
        // primary: "#0053D5",       // Xanh cyan tươi – chủ đạo, tạo cảm giác trong lành và năng động
        primary: "#17A2F3",       // Xanh cyan tươi – chủ đạo, tạo cảm giác trong lành và năng động
        accent: "#FFC107",        // Vàng tươi – nút nhấn/phụ trợ, thu hút mà không gắt
        background: "#E0F7FA",    // Xanh nhạt sáng – nền dịu, hiện đại
        surface: "#FFFFFF",       // Trắng – giữ sự rõ ràng cho các thẻ/card
        error: "#F44336",         // Đỏ tươi – rõ ràng nhưng không quá nặng nề
        text: "#212121",          // Đen nhạt – dễ đọc
        onSurface: "#212121",     // Màu chữ trên các surface trắng
        disabled: "#BDBDBD",      // Xám sáng – cho trạng thái bị vô hiệu hóa
        placeholder: "#9E9E9E",   // Gợi ý trong input – trung tính
        backdrop: "rgba(0, 0, 0, 0.3)", // Overlay mờ – không quá tối
        notification: "#FF7043",  // Cam tươi – thông báo nổi bật
    },
    roundness: 10,
    fonts: {
        ...DefaultTheme.fonts,
    },
}