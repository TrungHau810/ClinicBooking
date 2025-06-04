import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, Alert, FlatList, ScrollView, TouchableOpacity } from "react-native";
import { Button, Card } from "react-native-paper";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import HealthRecordCard from "../../components/HealthRecordCard";
import Header from "../../components/Header";
import { Picker } from "@react-native-picker/picker";

const ScheduleBooking = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { schedule, doctor } = route.params;
    const [symptoms, setSymptoms] = useState("");
    const [selectedDisease, setSelectedDisease] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);


    const diseaseType = [
        { key: 'HoHap', label: 'Đường hô hấp' },
        { key: 'TieuHoa', label: 'Đường tiêu hoá' },
        { key: 'TK_TT', label: 'Thần kinh - Tâm thần' },
        { key: 'Mat', label: 'Bệnh về Mắt' },
        { key: 'ChanThuong', label: 'Chấn thương - chỉnh hình' },
        { key: 'DaLieu', label: 'Da liễu' },
        { key: 'TaiMuiHong', label: 'Tai - Mũi - Họng' },
        { key: 'Khac', label: 'Khác' },
    ];

    const DiseaseSelector = ({ selected, setSelected }) => {
        return (
            <View style={{ marginBottom: 16 }}>
                <Text style={styles.title}>Chọn loại bệnh</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {diseaseType.map(item => {
                        const isSelected = selected === item.key;
                        return (
                            <TouchableOpacity
                                key={item.key}
                                onPress={() => setSelected(item.key)}
                                style={[
                                    styles.option,
                                    isSelected && styles.optionSelected
                                ]}
                            >
                                <Text style={isSelected ? styles.textSelected : styles.text}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>
        );
    };

    // Loading các hồ sơ sức khoẻ của user đang đăng nhập
    const loadRecords = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            const res = await Apis.get(endpoints["healthrecords"], {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setRecords(res.data);
        } catch (error) {
            console.error("Lỗi khi tải hồ sơ:", error);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity onPress={() => setSelectedRecord(item)}>
            <HealthRecordCard
                record={item}
                isSelected={selectedRecord?.id === item.id} // truyền để highlight
            />
        </TouchableOpacity>
    );


    const validate = () => {
        if (!selectedRecord) {
            Alert.alert("Lỗi", "Vui lòng chọn hồ sơ sức khoẻ!");
            return false;
        }
        if (selectedDisease === null) {
            Alert.alert("Lỗi", "Vui lòng chọn loại bệnh!");
            return false;
        }
        return true;
    };

    // Hàm tạo lịch khám
    const createAppointment = async () => {
        try {
            setLoading(true);
            if (validate()) {
                const token = await AsyncStorage.getItem("token");
                if (symptoms === "") {
                    setSymptoms("Không");
                }

                const res = await authApis(token).post(endpoints["appointments"], {
                    schedule_id: schedule.id,
                    healthrecord_id: selectedRecord.id,
                    disease_type: selectedDisease,
                    symptoms: symptoms,
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                console.log("-----------");
                console.info(res);

                Alert.alert(
                    "Thành công",
                    "Đặt lịch khám thành công!",
                    [
                        {
                            text: "OK",
                            onPress: () => navigation.navigate("AppointmentTab", { screen: "Appointment" }),
                        },
                    ],
                    { cancelable: false }
                );
            }
        } catch (error) {
            if (error.response && error.response.data && error.response.data.detail) {
                Alert.alert("Lỗi", error.response.data.detail);
            } else {
                console.log(error);
                Alert.alert("Lỗi", "Không thể đặt lịch!");
            }
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        loadRecords();
    }, []);

    return (
        <View style={styles.container}>
            <Header title="Chọn lịch khám" />
            <Text style={styles.title}>Đặt lịch với bác sĩ {doctor.doctor}</Text>
            <Text style={styles.title}>Bệnh viện: {doctor.hospital_name}</Text>
            <Text style={styles.title}>Chuyên khoa: {doctor.specialization_name}</Text>
            <Text style={styles.date}>Ngày: {new Date(schedule.date).toLocaleDateString('vi-VN')}</Text>
            <Text>Giờ: {schedule.start_time} - {schedule.end_time}</Text>

            <FlatList
                data={records}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
            />

            <View style={styles.dropdownContainer}>
                <Text style={styles.title}>Chọn loại bệnh</Text>
                <View style={styles.pickerWrapper}>
                    <Picker
                        selectedValue={selectedDisease}
                        onValueChange={(itemValue) => setSelectedDisease(itemValue)}
                        style={styles.picker}
                    >
                        <Picker.Item label="-- Chọn loại bệnh --" value={null} />
                        {diseaseType.map((item) => (
                            <Picker.Item key={item.key} label={item.label} value={item.key} />
                        ))}
                    </Picker>
                </View>
            </View>

            <TextInput
                placeholder="Triệu chứng (nếu có)"
                value={symptoms}
                onChangeText={setSymptoms}
                style={[styles.input, { height: 100 }]}
                multiline
            />




            <Button loading={loading} disabled={loading} mode="contained" onPress={createAppointment}>Xác nhận đặt lịch</Button>
        </View>
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
        fontWeight: "bold",
        marginBottom: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 10,
        marginBottom: 16,
    }, dropdownContainer: {
        marginBottom: 16,

    }, pickerWrapper: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        overflow: "hidden",
    },
    picker: {
        height: 50,
        width: "100%",
    },

});

export default ScheduleBooking;
