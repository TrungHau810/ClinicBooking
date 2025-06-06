import React, { useEffect, useState } from "react";
import {
    View,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Dimensions,
    TouchableOpacity,
} from "react-native";
import { Text } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { endpoints } from "../../configs/Apis";
import { BarChart } from "react-native-chart-kit";
import { Picker } from "@react-native-picker/picker";

const screenWidth = Dimensions.get("window").width;

const DoctorReport = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(null);
    const [quarter, setQuarter] = useState(null);
    const [year, setYear] = useState(2025);

    const fetchData = async () => {
        try {
            const token = await AsyncStorage.getItem("token");

            let url = `${endpoints["reportsdoctor"]}?year=${year}`;
            if (month) url += `&month=${month}`;
            if (!month && quarter) url += `&quarter=${quarter}`;

            const res = await Apis.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setData(res.data);
        } catch (err) {
            console.error("Lỗi khi tải báo cáo:", err?.response?.data || err.message);
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
                <Text>Không thể tải dữ liệu thống kê.</Text>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Báo cáo bác sĩ</Text>

            <View style={styles.filterSection}>
                <View style={styles.pickerWrapper}>
                    <Text style={styles.label}>Tháng</Text>
                    <Picker
                        selectedValue={month}
                        onValueChange={(value) => {
                            setMonth(value);
                            setQuarter(null); // nếu chọn tháng thì bỏ quý
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
                            setMonth(null); // nếu chọn quý thì bỏ tháng
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

            <View style={styles.card}>
                <Text style={styles.stat}>Tổng cuộc hẹn: {data.total_appointment}</Text>
                <Text style={styles.stat}>Đã khám: {data.examined_count}</Text>
                <Text style={styles.stat}>Chưa khám: {data.unexamined_count}</Text>
            </View>

            <Text style={styles.label}>Top 5 bệnh thường gặp</Text>
            {data.top_disease?.length > 0 ? (
                <BarChart
                    data={{
                        labels: data.top_disease.map((item) => item.disease_type || "Không rõ"),
                        datasets: [{ data: data.top_disease.map((item) => item.count) }],
                    }}
                    width={screenWidth - 32}
                    height={220}
                    chartConfig={{
                        backgroundGradientFrom: "#fff",
                        backgroundGradientTo: "#fff",
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                        labelColor: () => "#444",
                    }}
                    style={{ borderRadius: 12, marginTop: 12 }}
                />
            ) : (
                <Text style={{ color: "#888" }}>Không có dữ liệu bệnh</Text>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        paddingBottom: 32,
        backgroundColor: "#fff",
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 20,
        color: "#007bff",
    },
    card: {
        backgroundColor: "#eef7ff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    stat: {
        fontSize: 16,
        marginVertical: 4,
        color: "#333",
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 4,
        marginTop: 12,
        color: "#555",
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    pickerWrapper: {
        backgroundColor: "#f8f9fa",
        borderRadius: 8,
        padding: 12,
    },
    picker: {
        backgroundColor: "#fff",
        marginVertical: 4,
        borderRadius: 8,
    },
    clearBtn: {
        marginTop: 8,
        alignSelf: "flex-start",
    },
    clearText: {
        color: "#dc3545",
        fontSize: 14,
    },
    filterSection: {
        marginBottom: 20,
    },
});

export default DoctorReport;
