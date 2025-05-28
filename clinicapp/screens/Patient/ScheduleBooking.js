import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, Alert } from "react-native";
import { Button } from "react-native-paper";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ScheduleBooking = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { schedule, doctor } = route.params;
    const [symptoms, setSymptoms] = useState("");
    const [diseaseType, setDiseaseType] = useState("");
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            const jsonValue = await AsyncStorage.getItem("currentUser");
            console.log("User in AsyncStorage (ScheduleBooking):", jsonValue);
            if (jsonValue !== null) {
                const parsed = JSON.parse(jsonValue);
                setCurrentUser(parsed);
                console.log("Loaded user from AsyncStorage:", parsed);
            } else {
                Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
                navigation.navigate("Login");
            }
        };

        fetchUser();
    }, []);

    const createAppointment = async () => {
        if (!diseaseType || !symptoms) {
            Alert.alert("Thiếu thông tin", "Vui lòng nhập loại bệnh và triệu chứng.");
            return;
        }
        try {
            const token = await AsyncStorage.getItem("token");
            console.log("Access Token:", token);

            if (!token) {
                Alert.alert("Lỗi", "Không tìm thấy access token!");
                return;
            }
            console.log("Schedule before booking:", schedule);

            const res = await authApis(token).post(endpoints["appointments"], {
                schedule: schedule.id,
                healthrecord: currentUser.healthrecord.id,
                disease_type: diseaseType,
                symptoms: symptoms,
            });
            
            console.log("Current user:", currentUser);

            Alert.alert("Thành công", "Đặt lịch khám thành công!");
            navigation.navigate("tabs", { screen: "appointment", });
        } catch (error) {
            console.error("Appointment error:", error);
            if (error.response) {
                console.log("RESPONSE ERROR DATA:", error.response.data);
            }
            Alert.alert("Lỗi", "Không thể đặt lịch!");
        }
    };


    return (
        <View style={styles.container}>
            <Text style={styles.title}>Đặt lịch với bác sĩ {doctor.user.full_name}</Text>
            <Text>Ngày: {schedule.date}</Text>
            <Text>Giờ: {schedule.start_time} - {schedule.end_time}</Text>

            <TextInput
                placeholder="Loại bệnh"
                value={diseaseType}
                onChangeText={setDiseaseType}
                style={styles.input}
            />
            <TextInput
                placeholder="Triệu chứng"
                value={symptoms}
                onChangeText={setSymptoms}
                multiline
                numberOfLines={4}
                style={[styles.input, { height: 100 }]}
            />


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
