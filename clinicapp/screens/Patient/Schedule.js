import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Apis, { endpoints } from "../../configs/Apis";
import { useRoute } from "@react-navigation/native";
import { Button, Card } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Header from "../../components/Header";

const Schedule = () => {
    const route = useRoute();
    const { doctor } = route.params;
    const navigation = useNavigation();
    const [schedules, setSchedules] = useState([]);
    //const [currentUser, setCurrentUser] = useState(null);

    console.log(doctor);

    const loadSchedule = async () => {
        try {
            const res = await Apis.get(`${endpoints["schedules"]}?doctor_id=${doctor.user.id}`);
            setSchedules(res.data);
            console.info(res.data);
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        loadSchedule();
    }, [doctor]);


    const renderSchedule = ({ item }) => (
        <View style={[styles.scheduleItem, !item.active && { opacity: 0.5 }]}>
            <Text style={styles.date}>Ngày: {new Date(item.date).toLocaleDateString('vi-VN')}</Text>
            <Text>
                Giờ: {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}
            </Text>
            <Text>Số lượng tối đa: {item.capacity}</Text>
            <Text style={{ color: !item.active ? 'gray' : 'green' }}>
                Trạng thái: {!item.active ? 'Hết chỗ' : 'Còn chỗ'}
            </Text>
            <Card.Actions>
                <Button mode="contained" disabled={!item.active} onPress={() => navigation.navigate("ScheduleBooking", { doctor, schedule: item })}>Chọn</Button>
            </Card.Actions>
        </View>
    );


    return (
        <SafeAreaView style={styles.container}>
            <Header title="Chọn lịch khám" />
            <Text style={styles.header}>Lịch khám của bác sĩ {doctor.doctor}</Text>
            <FlatList
                data={schedules}
                // keyExtractor={(item) => item.id.toString()}
                renderItem={renderSchedule}
                contentContainerStyle={styles.list}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: "#fff",
    },
    header: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 16,
        textAlign: "center",
    },
    list: {
        paddingBottom: 20,
    },
    scheduleItem: {
        padding: 16,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        marginBottom: 12,
        backgroundColor: "#f9f9f9",
    },
    date: {
        fontWeight: "bold",
        fontSize: 16,
        marginBottom: 4,
    },
});

export default Schedule;