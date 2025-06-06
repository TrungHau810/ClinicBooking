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
    const [isVerified, setIsVerified] = useState(true);


    const loadDoctor = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            const res = await authApis(token).get(endpoints["current-user"]);
            console.log(res.data);
            setDoctor(res.data);
        } catch (error) {
            console.error("Lỗi khi lấy thông tin bác sĩ:", error);
        }
    };

    const loadInfo = async () => {
        let res = await Apis.get(`${endpoints['doctor-detail']}?user_id=${user.payload.id}`);
        setIsVerified(res.data.is_verified);
    };

    useEffect(() => {
        loadDoctor();
    }, []);

    useEffect(() => {
        loadInfo();
    }, [user])

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

    const loadPatientsExaminedmedicalResultsCreatedCount = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            const res = await authApis(token).get(endpoints["appointments"]);
            const appointments = res.data;

            const completedCount = appointments.filter(item => item.status === "completed").length;
            setStats(prev => ({
                ...prev,
                patientsExamined: completedCount,
                medicalResultsCreated: completedCount,
            }));
        } catch (error) {
            console.error("Lỗi khi đếm lịch đã khám:", error);
        }
    };

    useEffect(() => {
        loadDoctor();
        loadTodayAppointmentsCount();
        loadPatientsExaminedmedicalResultsCreatedCount();
    }, []);

    return (
        <SafeAreaView>
            <ScrollView contentContainerStyle={styles.container}>
                {user?.payload?.full_name && (
                    <View style={styles.greetingRow}>
                        <Icon source="hand-wave" size={24} color="#f9a825" style={{ marginRight: 8 }} />
                        <Text style={styles.header}>
                            Chào mừng bác sĩ {user.payload.full_name}
                        </Text>
                    </View>
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
                        <View style={styles.iconContainer}>
                            <Icon source="calendar" size={28} color={theme.colors.primary} />
                        </View>
                        <Text>Lịch hẹn</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickButton} onPress={() => navigation.navigate("HealthRecords")}>
                        <View style={styles.iconContainer}>
                            <Icon source="clipboard-text-outline" size={28} color={theme.colors.primary} />
                        </View>
                        <Text>Hồ sơ</Text>
                    </TouchableOpacity>
                    {/* <TouchableOpacity style={styles.quickButton} onPress={() => navigation.navigate("PatientHealthRecords")}>
                        <View style={styles.iconContainer}>
                            <Icon source="file-document-edit-outline" size={28} color={theme.colors.primary} />
                        </View>
                        <Text>Kết quả khám</Text>
                    </TouchableOpacity> */}
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
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1565C0',
        marginLeft: 8,
    },
    statsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        marginHorizontal: 4,
        paddingVertical: 16,
        alignItems: "center",
        borderRadius: 12,
        elevation: 3,
        backgroundColor: "#f5f9ff", // hoặc tạo gradient
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
    iconContainer: {
        backgroundColor: "#e6f0ff",
        borderRadius: 30,
        padding: 10,
        marginBottom: 8,
    },
    greetingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
});

export default DoctorHome;
