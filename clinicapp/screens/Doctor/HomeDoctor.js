import React, { useState, useEffect, useContext } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Button, Card, Icon, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MyUserContext } from "../../configs/MyContexts";
import { useNavigation } from "@react-navigation/native";

const DoctorHome = ({ navigation }) => {
    const theme = useTheme();
    const user = useContext(MyUserContext);
    const nav = useNavigation();
    const [doctor, setDoctor] = useState([null]);

    const loadDoctor = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            const res = await authApis(token).get(endpoints["current-user"]);
            setDoctor(res.data);
        } catch (error) {
            console.error("Lỗi khi lấy thông tin bác sĩ:", error);
        }
    };



    useEffect(() => {
        loadDoctor();
    }, []);

    const [stats, setStats] = useState({
        todayAppointments: 0,
        patientsExamined: 0,
        medicalResultsCreated: 0,
    });

    const loadTodayAppointmentsCount = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            const res = await authApis(token).get(endpoints["appointments"]);
            const appointments = res.data;

            const today = new Date();
            const count = appointments.filter(item => {
                const date = new Date(item.schedule.date);
                return (
                    date.getDate() === today.getDate() &&
                    date.getMonth() === today.getMonth() &&
                    date.getFullYear() === today.getFullYear() &&
                    item.status !== 'canceled' &&
                    item.status !== 'completed'
                );
            }).length;

            setStats(prev => ({
                ...prev,
                todayAppointments: count,
            }));
        } catch (error) {
            console.error("Lỗi khi lấy số lịch hẹn hôm nay:", error);
        }
    };

    useEffect(() => {
        loadDoctor();
        loadTodayAppointmentsCount();
    }, []);

    return (
        <SafeAreaView>
            <ScrollView contentContainerStyle={styles.container}>
                {user?.payload?.full_name && (
                    <Text style={styles.header}>
                        Chào mừng bác sĩ {user.payload.full_name}
                    </Text>
                )}
                <View style={styles.statsRow}>
                    <Card style={styles.statCard}>
                        <Card.Content>
                            <Icon source="calendar" size={30} color={theme.colors.primary} />
                            <Text style={styles.statNumber}>{stats.todayAppointments}</Text>
                            <Text>Lịch hẹn hôm nay</Text>
                        </Card.Content>
                    </Card>
                    <Card style={styles.statCard}>
                        <Card.Content>
                            <Icon source="account-check-outline" size={30} color={theme.colors.primary} />
                            <Text style={styles.statNumber}>{stats.patientsExamined}</Text>
                            <Text>Bệnh nhân đã khám</Text>
                        </Card.Content>
                    </Card>
                    <Card style={styles.statCard}>
                        <Card.Content>
                            <Icon source="file-document-edit-outline" size={30} color={theme.colors.primary} />
                            <Text style={styles.statNumber}>{stats.medicalResultsCreated}</Text>
                            <Text>Kết quả đã tạo</Text>
                        </Card.Content>
                    </Card>
                </View>

                <Text style={styles.sectionTitle}>Chức năng nhanh</Text>

                <View style={styles.quickActions}>
                    <TouchableOpacity style={styles.quickButton} onPress={() => navigation.navigate("Appointment")}>
                        <Icon source="calendar-account" size={28} />
                        <Text>Lịch hẹn</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickButton} onPress={() => navigation.navigate("HealthRecords")}>
                        <Icon source="clipboard-text-outline" size={28} />
                        <Text>Hồ sơ</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickButton} onPress={() => navigation.navigate("CreateMedicalResult")}>
                        <Icon source="file-document-edit-outline" size={28} />
                        <Text>Kết quả khám</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
            <Button mode="contained" onPress={() => nav.navigate("ChatStack")}>Nhắn tin</Button>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: "#fff",
    },
    header: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 20,
    },
    statsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        marginHorizontal: 4,
        paddingVertical: 10,
        alignItems: "center",
    },
    statNumber: {
        fontSize: 24,
        fontWeight: "bold",
        marginVertical: 8,
        textAlign: "center",
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 12,
    },
    quickActions: {
        flexDirection: "row",
        justifyContent: "space-around",
    },
    quickButton: {
        alignItems: "center",
        padding: 10,
    },
});

export default DoctorHome;
