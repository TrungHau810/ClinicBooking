// import { Chip, Text } from "react-native-paper";
// import { SafeAreaView } from "react-native-safe-area-context";


// const status = [
//     { label: "Đang chờ xác nhận" },
//     { label: "Đã xác nhận" },
//     { label: "Đã hoàn thành" },
//     { label: "Đã huỷ" },
// ];



// const Appointment = () => {

//     return (
//         <SafeAreaView>

//             {status.map(s => <Chip mode="outlined">{s.label}</Chip>)}

//             <Text>Đặt lịch hẹn khám bệnh</Text>
//         </SafeAreaView>
//     );
// }

// export default Appointment;


import { useContext, useEffect, useState } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { Button, Card, Chip, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MyDispatchContext, MyUserContext } from "../../configs/MyContexts";
import { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";

const statusList = [
    { label: "Chưa thanh toán", value: "unpaid" },
    { label: "Đã thanh toán", value: "paid" },
    { label: "Đã khám", value: "completed" },
    { label: "Đã huỷ", value: "canceled" },
];

const Appointment = () => {
    const [selectedStatus, setSelectedStatus] = useState("unpaid");
    const [appointments, setAppointments] = useState([]);

    const user = useContext(MyUserContext);

    const loadAppointments = async () => {
        const token = await AsyncStorage.getItem('token');
        const res = await authApis(token).get(endpoints['appointments']);
        console.log(res.data);
        setAppointments(res.data);
    };

    useEffect(() => {
        loadAppointments();
    }, []);

    const renderStatus = (status) => {
        switch (status) {
            case "unpaid":
                return <Chip style={styles.pendingChip}>Chưa thanh toán</Chip>;
            case "paid":
                return <Chip style={styles.confirmedChip}>Đã thanh toán</Chip>;
            case "completed":
                return <Chip style={styles.canceledChip}>Đã khám</Chip>;
            case "cancelled":
                return <Chip style={styles.completedChip}>Đã huỷ</Chip>;
            
            default:
                return <Chip>{status}</Chip>;
        }
    };

    const renderAppointment = ({ item }) => (
        <Card style={styles.card}>
            <Card.Content>
                <Text variant="titleMedium">Bệnh lý: {item.disease_type}</Text>
                <Text>Ngày: {new Date(item.schedule_date).toLocaleDateString()}</Text>
                <Text>Thời gian: {item.schedule_start.slice(0, 5)} - {item.schedule_end.slice(0, 5)}</Text>
            </Card.Content>
            <Card.Content>
                {renderStatus(item.status)}
                {item.cancel_reason && (
                    <Text style={styles.cancelReason}>Lý do huỷ: {item.cancel_reason}</Text>
                )}
                <Button mode="contained" style={styles.button}>Chi tiết</Button>
            </Card.Content>
        </Card>
    );

    const filteredAppointments = appointments.filter(item => item.status === selectedStatus);

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Lọc theo trạng thái:</Text>

            <View style={styles.chipContainer}>
                {statusList.map((s) => (
                    <Chip
                        key={s.label}
                        mode="outlined"
                        selected={selectedStatus === s.value}
                        onPress={() => setSelectedStatus(s.value)}
                        style={[
                            styles.chip,
                            selectedStatus === s.value && styles.selectedChip,
                        ]}
                        textStyle={{
                            color: selectedStatus === s.value ? "#fff" : "#333",
                        }}
                    >
                        {s.label}
                    </Chip>
                ))}
            </View>

            {filteredAppointments.length > 0 ? (
                <FlatList
                    data={filteredAppointments}
                    renderItem={renderAppointment}
                    keyExtractor={(item) => item.id.toString()}
                />
            ) : (
                <Text style={styles.noAppointmentText}>
                    Bạn chưa có phiếu khám nào
                </Text>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: "#fff",
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 12,
    },
    chipContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 20,
    },
    chip: {
        marginRight: 8,
        marginBottom: 8,
        borderColor: "#ccc",
    },
    selectedChip: {
        backgroundColor: "#2196F3",
        borderColor: "#2196F3",
    },
    subtitle: {
        fontSize: 16,
        fontWeight: "500",
        marginTop: 20,
        marginBottom: 10,
    },
    card: {
        marginBottom: 16,
        borderRadius: 8,
        elevation: 3,
    },
    cancelReason: {
        marginTop: 8,
        fontSize: 14,
        color: "#e74c3c",
    },
    button: {
        marginTop: 16,
        alignSelf: "flex-start",
    },
    noAppointmentText: {
        fontSize: 16,
        color: "#888",
        marginTop: 40,
        textAlign: "center",
    },
    // Chip styles for each status
    pendingChip: {
        backgroundColor: "#f39c12",
        color: "#fff",
    },
    confirmedChip: {
        backgroundColor: "#2ecc71",
        color: "#fff",
    },
    completedChip: {
        backgroundColor: "#3498db",
        color: "#fff",
    },
    canceledChip: {
        backgroundColor: "#e74c3c",
        color: "#fff",
    },
});

export default Appointment;
