import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Text, Card, Button, TextInput } from "react-native-paper";
import { useRoute, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import Header from "../../components/Header"

const AppointmentDetails = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const appointment = route?.params?.appointment;
    const doctor = route?.params?.doctor;
    const diseaseTypeMap = route?.params?.diseaseList;
    const statusList = route?.params?.statusList;
    const [refreshing, setRefreshing] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [loading, setLoading] = useState(false);


    const getStatusLabel = (statusValue) => {
        const statusObj = statusList.find(s => s.value === statusValue);
        return statusObj ? statusObj.label : statusValue;
    };

    console.log(doctor);

    const handleCancel = async () => {
        if (!cancelReason.trim()) {
            Alert.alert("Thông báo", "Vui lòng nhập lý do huỷ");
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
                    { reason: cancelReason }
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
                    console.log(message);
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
            <Header title={"Chi tiết lịch khám"} />
            <Card>
                <Card.Content>
                    <Text variant="titleLarge">Chi tiết lịch khám với BS {}</Text>
                    <Text>Bác sĩ: {doctor.user.full_name}</Text>
                    <Text>Bệnh viện: {doctor.hospital_name}</Text>
                    <Text>Bác sĩ: {doctor.specialization_name}</Text>
                    <Text>Bệnh lý: {diseaseTypeMap[appointment.disease_type] || appointment.disease_type}</Text>
                    <Text>
                        Ngày: {new Date(appointment.schedule.date).toLocaleDateString()}
                    </Text>
                    <Text>
                        Giờ: {appointment.schedule.start_time.slice(0, 5)} -{" "}
                        {appointment.schedule.end_time.slice(0, 5)}
                    </Text>
                    <Text>Trạng thái: {getStatusLabel(appointment.status)}</Text>
                    {appointment.cancel_reason && (
                        <Text style={styles.cancelText}>Lý do huỷ: {appointment.cancel_reason}</Text>
                    )}
                </Card.Content>
            </Card>

            {appointment.status !== "cancelled" && appointment.status !== "completed" && (
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
