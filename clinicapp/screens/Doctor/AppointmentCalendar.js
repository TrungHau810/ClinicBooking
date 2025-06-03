import { useEffect, useState, useCallback, useContext } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { Calendar } from "react-native-calendars";
import { Text, Card, Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MyUserContext } from "../../configs/MyContexts";

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
        unpaid: "#f39c12",     // cam
        paid: "#2ecc71",       // xanh lá
        completed: "#3498db",  // xanh dương
        canceled: "#e74c3c",   // đỏ
    };

    const markAppointments = (appointments) => {
        const marks = {};

        appointments.forEach((item) => {
            const date = item.schedule_date;
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

    const filteredAppointments = selectedDate ? appointments.filter((a) => a.schedule_date === selectedDate) : [];

    return (
        <SafeAreaView style={styles.container}>
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
                <View style={styles.listContainer}>
                    <Text style={styles.dateTitle}>
                        Lịch khám ngày {new Date(selectedDate).toLocaleDateString()}
                    </Text>

                    {filteredAppointments.length > 0 ? (
                        <FlatList
                            data={filteredAppointments}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <Card style={styles.card}>
                                    <Card.Content>
                                        <Text>Bệnh nhân: {item.healthrecord.full_name}</Text>
                                        <Text>Bệnh lý: {item.disease_type}</Text>
                                        <Text>
                                            Thời gian: {item.schedule_start.slice(0, 5)} -{" "}
                                            {item.schedule_end.slice(0, 5)}
                                        </Text>
                                    </Card.Content>
                                </Card>
                            )}
                        />
                    ) : (
                        <Text style={styles.noAppointment}>Không có lịch hẹn hôm nay</Text>
                    )}
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    listContainer: {
        padding: 16,
    },
    dateTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 12,
    },
    card: {
        marginBottom: 12,
        padding: 8,
        borderRadius: 8,
        elevation: 3,
    },
    noAppointment: {
        marginTop: 20,
        fontSize: 16,
        color: "#888",
        textAlign: "center",
    },
});

export default AppointmentCalendar;


