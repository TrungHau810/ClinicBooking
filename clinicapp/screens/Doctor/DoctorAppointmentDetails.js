import React, { useState } from "react";
import { View, StyleSheet, Alert, SafeAreaView } from "react-native";
import { Button, Card, Chip, Text } from "react-native-paper";
import { useRoute, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import Header from "../../components/Header";

const DoctorAppointmentDetails = () => {
    const { params } = useRoute();
    const navigation = useNavigation();
    const [appointment, setAppointment] = useState(params.appointment);
    const [diseaseTypeMap] = useState(params.diseaseTypeMap);

    const markAsCompleted = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            const res = await authApis(token).patch(
                `${endpoints["appointments"]}${appointment.id}/`,
                { status: "completed" }
            );
            setAppointment(res.data);
            Alert.alert("Thành công", "Đã cập nhật trạng thái thành 'Đã khám'.");
        } catch (err) {
            console.error("Lỗi cập nhật trạng thái:", err);
            Alert.alert("Lỗi", "Không thể cập nhật trạng thái.");
        }
    };

    const renderStatus = (status) => {
        switch (status) {
            case "unpaid":
                return <Chip style={styles.pendingChip}>Chưa thanh toán</Chip>;
            case "paid":
                return <Chip style={styles.confirmedChip}>Đã thanh toán</Chip>;
            case "completed":
                return <Chip style={styles.completedChip}>Đã khám</Chip>;
            case "canceled":
                return <Chip style={styles.canceledChip}>Đã huỷ</Chip>;
            default:
                return <Chip>{status}</Chip>;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Header title={"Tạo kết quả xét nghiệm"} />
            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleMedium" style={styles.itemText}>
                        Bệnh nhân: {appointment.healthrecord.full_name}
                    </Text>
                    <Text style={styles.itemText}>Bệnh lý: {appointment.disease_type}</Text>
                    <Text style={styles.itemText}>Triệu chứng: {appointment.symptoms}</Text>
                    <Text style={styles.itemText}>
                        Ngày: {new Date(appointment.schedule.date).toLocaleDateString()}
                    </Text>
                    <Text style={styles.itemText}>
                        Giờ: {appointment.schedule.start_time?.slice(0, 5)} - {appointment.schedule.end_time?.slice(0, 5)}
                    </Text>
                    {renderStatus(appointment.status)}
                    {appointment.cancel_reason && (
                        <Text style={[styles.itemText, styles.cancelReason]}>
                            Lý do huỷ: {appointment.cancel_reason}
                        </Text>
                    )}
                </Card.Content>
            </Card>

            {appointment.status !== "completed" && appointment.status !== "canceled" && (
                <Button
                    mode="contained"
                    style={styles.button}
                    onPress={markAsCompleted}
                >
                    Đánh dấu đã khám
                </Button>
            )}

            {appointment.status === "completed" && (
                <Button
                    mode="contained"
                    style={styles.resultButton}
                    onPress={() =>
                        navigation.navigate("CreateMedicalResult", {
                            appointmentId: appointment.id,
                            patientName: appointment.healthrecord.full_name,
                            healthRecordId: appointment.healthrecord.id,
                        })
                    }
                >
                    Tạo kết quả khám
                </Button>
            )}


            <Button
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                Quay lại
            </Button>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: "#fff",
        flex: 1,
    },
    card: {
        marginBottom: 20,
        borderRadius: 8,
        elevation: 2,
    },
    cancelReason: {
        marginTop: 8,
        fontSize: 14,
        color: "#e74c3c",
    },
    button: {
        marginTop: 16,
        backgroundColor: "#3498db",
    },
    backButton: {
        marginTop: 12,
        alignSelf: "flex-start",
    },
    pendingChip: {
        backgroundColor: "#f39c12",
        marginTop: 10,
    },
    confirmedChip: {
        backgroundColor: "#2ecc71",
        marginTop: 10,
    },
    completedChip: {
        backgroundColor: "#3498db",
        marginTop: 10,
    },
    canceledChip: {
        backgroundColor: "#e74c3c",
        marginTop: 10,
    },
    resultButton: {
        marginTop: 12,
        backgroundColor: "#27ae60",
    },
    itemText: {
        marginBottom: 8,
    },
});

export default DoctorAppointmentDetails;