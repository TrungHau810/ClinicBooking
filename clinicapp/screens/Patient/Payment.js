import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/Header";
import { useNavigation, useRoute } from "@react-navigation/native";
import Apis, { endpoints } from "../../configs/Apis";
import WebView from "react-native-webview";
import { ActivityIndicator, Text } from "react-native-paper";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import { useState } from "react";

const Payment = () => {

    const { appointmentId } = useRoute().params;
    const [paymentUrl, setPaymentUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const nav = useNavigation();
    const [shouldCloseWebView, setShouldCloseWebView] = useState(false);

    console.log(appointmentId);

    const createPaymentUrl = async () => {
        setLoading(true);
        try {
            const res = await Apis.post(endpoints['create-vnpay-url'], { "appointment_id": appointmentId });
            const url = res.data.payment_url;
            console.log(url);
            if (url) {
                setPaymentUrl(url);
            } else {
                Alert.alert("Lỗi", "Không lấy được đường dẫn thanh toán");
            }
        } catch (error) {
            Alert.alert("Lỗi", "Gọi API thất bại: " + error.message);
        } finally {
            setLoading(false);
        }
    };


    if (paymentUrl && !shouldCloseWebView) {
        // Hiển thị WebView để thanh toán VNPay
        return (
            <SafeAreaView style={{ flex: 1 }}>
                <Header title={"Thanh toán"} />
                <WebView
                    source={{ uri: paymentUrl }}
                    startInLoadingState={true}
                    renderLoading={() => <ActivityIndicator style={{ flex: 1 }} size="large" />}
                    onNavigationStateChange={(navState) => {
                        const url = navState.url;
                        console.log(url);
                        if (url.startsWith("http://localhost:8000/api/vnpay_return/?")) {
                            const params = new URLSearchParams(url.split("?")[1]);
                            console.log(params);
                            const responseCode = params.get("vnp_ResponseCode");
                            console.log(responseCode);
                            if (responseCode === "00") {
                                setShouldCloseWebView(true);
                                Alert.alert("Thanh toán thành công", "Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi", [
                                    {
                                        text: "OK",
                                        onPress: () => nav.navigate("Appointment")
                                    }
                                ]);

                            } else {
                                setShouldCloseWebView(true);
                                Alert.alert("Thất bại","Thanh toán thất bại");
                            }
                            // Tắt WebView, quay về màn hình trước
                        }
                    }}

                />
            </SafeAreaView>
        );
    }


    console.log(appointmentId);

    // Màn hình chọn thanh toán
    return (
        <SafeAreaView style={{ flex: 1 }}>
            <Header title={"Thanh toán"} />
            <View style={styles.container}>
                <Text style={styles.text}>Mã lịch hẹn: {appointmentId}</Text>
                <TouchableOpacity style={styles.payButton} onPress={createPaymentUrl} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.payButtonText}>Thanh toán VNPay</Text>}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { padding: 20, flex: 1, justifyContent: "center" },
    text: { fontSize: 16, marginBottom: 40, textAlign: "center" },
    payButton: {
        backgroundColor: "#0066CC",
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
    },
    payButtonText: {
        color: "#fff",
        fontSize: 18,
    },
});

export default Payment;