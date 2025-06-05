import { useEffect, useState, useContext } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { Calendar } from "react-native-calendars";
import { Text, Card } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MyUserContext } from "../../configs/MyContexts";
import Header from "../../components/Header";

const AppointmentCalendar = () => {
    const [appointments, setAppointments] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [markedDates, setMarkedDates] = useState({});
    const user = useContext(MyUserContext);

    const loadAppointments = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            const res = await authApis(token).get(endpoints["appointments"]);
            setAppointments(res.data);
        } catch (err) {
            console.error("Lỗi khi tải lịch khám:", err);
        }
    };

    const statusColors = {
        unpaid: "#f39c12",
        paid: "#2ecc71",
        completed: "#3498db",
        canceled: "#e74c3c",
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

    const markAppointments = (appointments) => {
        const marks = {};
        appointments.forEach((item) => {
            const date = item.schedule.date;
            const color = statusColors[item.status] || "#999";
            const key = item.status;
            const dot = { key, color };

            if (!marks[date]) {
                marks[date] = { dots: [dot], marked: true };
            } else {
                const alreadyMarked = marks[date].dots.some(d => d.key === key);
                if (!alreadyMarked) {
                    marks[date].dots.push(dot);
                }
            }
        });
        setMarkedDates(marks);
    };

    useEffect(() => {
        loadAppointments();
    }, []);

    useEffect(() => {
        markAppointments(appointments);
    }, [appointments]);

    const filteredAppointments = selectedDate
        ? appointments.filter((a) => a.schedule.date === selectedDate)
        : [];

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <Header title={"Lịch hẹn khám bệnh"} />
            <FlatList
                data={selectedDate ? filteredAppointments : []}
                keyExtractor={(item) => item.id.toString()}
                ListHeaderComponent={
                    <>
                        <Calendar
                            markingType="multi-dot"
                            markedDates={{
                                ...markedDates,
                                ...(selectedDate && {
                                    [selectedDate]: {
                                        ...markedDates[selectedDate],
                                        selected: true,
                                        selectedColor: "#2196F3",
                                    },
                                }),
                            }}
                            onDayPress={(day) => setSelectedDate(day.dateString)}
                        />

                        <View style={{ flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, marginTop: 10 }}>
                            {Object.entries(statusColors).map(([key, color]) => (
                                <View key={key} style={{ flexDirection: "row", alignItems: "center", marginRight: 12, marginBottom: 6 }}>
                                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, marginRight: 4 }} />
                                    <Text style={{ fontSize: 14 }}>
                                        {key === "unpaid" && "Chưa thanh toán"}
                                        {key === "paid" && "Đã thanh toán"}
                                        {key === "completed" && "Đã khám"}
                                        {key === "canceled" && "Đã huỷ"}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {selectedDate && (
                            <Text style={styles.dateTitle}>
                                Lịch khám ngày {new Date(selectedDate).toLocaleDateString()}
                            </Text>
                        )}
                    </>
                }
                renderItem={({ item }) => (
                    <View style={styles.recordBox}>
                        <Card style={styles.card}>
                            <Card.Content>
                                <Text style={styles.itemText}>Bệnh nhân: {item.healthrecord.full_name}</Text>
                                <Text style={styles.itemText}>Bệnh lý: {item.disease_type}</Text>
                                <Text style={styles.itemText}>
                                    Thời gian: {item.schedule.start_time.slice(0, 5)} - {item.schedule.end_time.slice(0, 5)}
                                </Text>
                                {renderStatus(item.status)}
                            </Card.Content>
                        </Card>
                    </View>
                )}
                ListEmptyComponent={
                    selectedDate ? (
                        <Text style={styles.noAppointment}>Không có lịch hẹn hôm nay</Text>
                    ) : null
                }
                contentContainerStyle={styles.container}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingBottom: 16,
        backgroundColor: "#fff",
        flexGrow: 1,
    },
    dateTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginTop: 16,
        marginHorizontal: 16,
        marginBottom: 12,
    },
    card: {
       padding: 3,
        borderRadius: 8,
        elevation: 3,
    },
    noAppointment: {
        marginTop: 20,
        fontSize: 16,
        color: "#888",
        textAlign: "center",
    },
    recordBox: {
        borderWidth: 1,
        borderColor: "#000",
        borderRadius: 10,
        backgroundColor: "#fff",
        marginBottom: 1,
        marginTop: 7,
        marginHorizontal: 10,
    },
    itemText: {
        marginBottom: 8, 
    },
});

export default AppointmentCalendar;
