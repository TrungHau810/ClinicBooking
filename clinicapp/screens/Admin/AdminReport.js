import React, { useEffect, useState } from "react";
import {
    View,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Dimensions,
    TouchableOpacity,
    SafeAreaView,
    Platform,
    StatusBar,
} from "react-native";
import { Text } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import { Picker } from "@react-native-picker/picker";
import { BarChart } from "react-native-chart-kit";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Header from "../../components/Header";

const screenWidth = Dimensions.get("window").width;

const AdminReport = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(null);
    const [quarter, setQuarter] = useState(null);
    const [year, setYear] = useState(2025);

    const fetchData = async () => {
        try {
            const token = await AsyncStorage.getItem("token");

            let url = `${endpoints["reportsadmin"]}?year=${year}`;
            if (month) url += `&month=${month}`;
            if (!month && quarter) url += `&quarter=${quarter}`;

            const res = await authApis(token).get(url);
            setData(res.data);
        } catch (err) {
            console.error("Lỗi khi tải báo cáo admin:", err?.response?.data || err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [month, quarter, year]);

    const handleClear = () => {
        setMonth(null);
        setQuarter(null);
    };

    if (loading) {
        return <ActivityIndicator style={{ flex: 1 }} size="large" />;
    }

    if (!data) {
        return (
            <View style={styles.center}>
                <Text>Không thể tải dữ liệu thống kê admin.</Text>
            </View>
        );
    }

    const chartData = {
        labels: ["Lượt khám", "Doanh thu"],
        datasets: [
            {
                data: [data.appointment_count || 0, data.revenue || 0],
            },
        ],
    };

    return (
        <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
            <Header title={"Thống kê báo cáo"} />
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Thống kê hệ thống</Text>

                <View style={styles.filterSection}>
                    <View style={styles.pickerWrapper}>
                        <Text style={styles.label}>Tháng</Text>
                        <Picker
                            selectedValue={month}
                            onValueChange={(value) => {
                                setMonth(value);
                                setQuarter(null);
                            }}
                            style={styles.picker}
                        >
                            <Picker.Item label="-- Chọn tháng --" value={null} />
                            {Array.from({ length: 12 }, (_, i) => (
                                <Picker.Item key={i + 1} label={`Tháng ${i + 1}`} value={i + 1} />
                            ))}
                        </Picker>

                        <Text style={styles.label}>Quý</Text>
                        <Picker
                            selectedValue={quarter}
                            onValueChange={(value) => {
                                setQuarter(value);
                                setMonth(null);
                            }}
                            style={styles.picker}
                        >
                            <Picker.Item label="-- Chọn quý --" value={null} />
                            {[1, 2, 3, 4].map((q) => (
                                <Picker.Item key={q} label={`Quý ${q}`} value={q} />
                            ))}
                        </Picker>

                        <Text style={styles.label}>Năm</Text>
                        <Picker
                            selectedValue={year}
                            onValueChange={(value) => setYear(value)}
                            style={styles.picker}
                        >
                            {[2023, 2024, 2025].map((y) => (
                                <Picker.Item key={y} label={`Năm ${y}`} value={y} />
                            ))}
                        </Picker>

                        <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
                            <Text style={styles.clearText}>Xóa bộ lọc</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.statCard}>
                    <MaterialCommunityIcons name="calendar-check-outline" size={30} color="#007bff" />
                    <View style={styles.statContent}>
                        <Text style={styles.statLabel}>Lượt khám</Text>
                        <Text style={styles.statValue}>{data.appointment_count}</Text>
                    </View>
                </View>

                <View style={styles.statCard}>
                    <MaterialCommunityIcons name="cash-multiple" size={30} color="#28a745" />
                    <View style={styles.statContent}>
                        <Text style={styles.statLabel}>Doanh thu</Text>
                        <Text style={styles.statValue}>{Number(data.revenue || 0).toLocaleString()} VND</Text>
                    </View>
                </View>

                <Text style={styles.chartTitle}>Biểu đồ thống kê</Text>
                <BarChart
                    data={chartData}
                    width={screenWidth - 32}
                    height={220}
                    chartConfig={{
                        backgroundColor: "#ffffff",
                        backgroundGradientFrom: "#ffffff",
                        backgroundGradientTo: "#ffffff",
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        style: { borderRadius: 16 },
                        propsForDots: { r: "6", strokeWidth: "2", stroke: "#007bff" },
                    }}
                    style={{ borderRadius: 16, marginTop: 16 }}
                />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: "#f2f6ff",
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 20,
        color: "#007bff",
    },
    filterSection: {
        marginBottom: 20,
    },
    pickerWrapper: {
        backgroundColor: "#fff",
        borderRadius: 8,
        padding: 12,
        elevation: 2,
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 4,
        marginTop: 12,
        color: "#555",
    },
    picker: {
        backgroundColor: "#f8f9fa",
        borderRadius: 8,
        marginVertical: 4,
    },
    clearBtn: {
        marginTop: 10,
        alignSelf: "flex-start",
    },
    clearText: {
        color: "#dc3545",
        fontSize: 14,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    statCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 3,
    },
    statContent: {
        marginLeft: 12,
    },
    statLabel: {
        fontSize: 15,
        color: "#555",
    },
    statValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#222",
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginTop: 20,
        marginBottom: 10,
        textAlign: "center",
        color: "#007bff",
    },
});

export default AdminReport;
