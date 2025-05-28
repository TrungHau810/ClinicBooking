import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, Alert, FlatList } from "react-native";
import { Button, Card } from "react-native-paper";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import HealthRecordCard from "../../components/HealthRecordCard";

const ScheduleBooking = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { schedule, doctor } = route.params;
    const [symptoms, setSymptoms] = useState("");
    const [diseaseType, setDiseaseType] = useState("");
    const [currentUser, setCurrentUser] = useState(null);
    const [records, setRecords] = useState([]);

    const info = [{
        field: "disease_type",
        label: "Loại bệnh",
        value: "diseaseType",
        event: "setDiseaseType"
    }, {
        field: "symptoms",
        label: "Triệu chứng (Nếu có)",
        value: "symptoms",
        event: "setSymptoms"
    }];

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

    useEffect(() => {
        loadRecords();
    }, []);

    const renderItem = ({ item }) => <HealthRecordCard record={item} />;


    const createAppointment = async () => {
        if (!diseaseType || !symptoms) {
            Alert.alert("Thiếu thông tin", "Vui lòng nhập loại bệnh và triệu chứng.");
            return;
        }
        try {
            let form = new FormData();
            form.append('')
            const token = await AsyncStorage.getItem("token");
            console.log("Access Token:", token);

            const res = await authApis(token).post(endpoints["appointments"], {
                schedule: schedule.id,
                healthrecords: 6,
                disease_type: diseaseType,
                symptoms: symptoms,
            });
            console.log("-----------");
            console.info(res);

            Alert.alert("Thành công", "Đặt lịch khám thành công!");
            navigation.navigate("tabs", { screen: "appointment", });
        } catch (error) {
            console.error("Appointment error:", error);
            Alert.alert("Lỗi", "Không thể đặt lịch!");
        }
    };

    const renderField = (arrayInfo) => {
        return arrayInfo.map(item => {
            return (
                <TextInput
                    key={item.field}
                    placeholder={item.label}
                    // value={item.value}
                    onChangeText={item.event}
                    style={[styles.input, { height: 100 }]}
                />
            );
        });
    };


    return (
        <View style={styles.container}>
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

            {renderField(info)}


            <Button mode="contained" onPress={createAppointment}>Xác nhận đặt lịch</Button>
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
    },
});

export default ScheduleBooking;
