import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Text, Card, Button, TextInput } from "react-native-paper";
import { useRoute, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";

const AppointmentDetails = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const appointment = route?.params?.appointment;

    const [cancelReason, setCancelReason] = useState("");
    const [loading, setLoading] = useState(false);

    const handleCancel = async () => {
        if (!cancelReason.trim()) {
            Alert.alert("Vui lòng nhập lý do huỷ");
            return;
        }

        try {
            const confirm = await new Promise((resolve) => {
                Alert.alert("Xác nhận", "Bạn có chắc chắn muốn huỷ lịch hẹn này?", [
                    { text: "Huỷ", style: "cancel", onPress: () => resolve(false) },
                    { text: "Đồng ý", onPress: () => resolve(true) },
                ]);
            });

            if (!confirm) return;

            setLoading(true);

            let token;
            try {
                token = await AsyncStorage.getItem("token");
                if (!token) throw new Error("Không tìm thấy token xác thực.");
            } catch (tokenErr) {
                console.error("Lỗi lấy token:", tokenErr);
                Alert.alert("Lỗi", "Không thể xác thực người dùng.");
                return;
            }

            try {
                await authApis(token).patch(
                    `${endpoints["appointments"]}${appointment.id}/cancel/`,
                    { cancel_reason: cancelReason }
                );

                Alert.alert("Huỷ thành công");
                navigation.navigate("Appointment", { refresh: true });
            } catch (apiError) {
                console.error("Lỗi API huỷ lịch:", apiError);
                let message = "Vui lòng thử lại sau.";

                if (apiError.response) {
                    message =
                        apiError.response.data?.detail ||
                        apiError.response.data?.error ||
                        JSON.stringify(apiError.response.data);
                }

                Alert.alert("Không thể huỷ lịch", message);
            }
        } catch (err) {
            console.error("Lỗi tổng quát khi huỷ:", err);
            Alert.alert("Lỗi", "Có lỗi xảy ra. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };



    return (
        <View style={styles.container}>
            <Card>
                <Card.Content>
                    <Text variant="titleLarge">Chi tiết lịch khám</Text>
                    <Text>Bệnh lý: {appointment.disease_type}</Text>
                    <Text>
                        Ngày: {new Date(appointment.schedule_date).toLocaleDateString()}
                    </Text>
                    <Text>
                        Giờ: {appointment.schedule_start.slice(0, 5)} -{" "}
                        {appointment.schedule_end.slice(0, 5)}
                    </Text>
                    <Text>Trạng thái: {appointment.status}</Text>
                    {appointment.cancel_reason && (
                        <Text style={styles.cancelText}>Lý do huỷ: {appointment.cancel_reason}</Text>
                    )}
                </Card.Content>
            </Card>

            {appointment.status !== "canceled" && appointment.status !== "completed" && (
                <>
                    <TextInput
                        label="Lý do huỷ"
                        value={cancelReason}
                        onChangeText={setCancelReason}
                        style={styles.input}
                        multiline
                    />
                    <Button
                        mode="contained"
                        onPress={handleCancel}
                        loading={loading}
                        disabled={loading}
                        style={styles.cancelBtn}
                    >
                        Huỷ lịch hẹn
                    </Button>
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        flex: 1,
        backgroundColor: "#fff",
    },
    cancelText: {
        color: "#e74c3c",
        marginTop: 10,
    },
    input: {
        marginTop: 20,
    },
    cancelBtn: {
        marginTop: 16,
        backgroundColor: "#e74c3c",
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});

export default AppointmentDetails;
