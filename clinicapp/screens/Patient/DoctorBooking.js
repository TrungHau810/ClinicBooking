import { useEffect, useState } from "react";
import { FlatList, Image, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Apis, { endpoints } from "../../configs/Apis";
import { Button, Card, List } from "react-native-paper";


const DoctorBooking = () => {

    const [doctor, setDoctor] = useState([]);

    const loadDoctor = async () => {
        let res = await Apis.get(endpoints['doctors']);
        console.log(res.data);
        setDoctor(res.data);
    };

    useEffect(() => {
        loadDoctor();
    }, []);

    const renderDoctor = (dr) => (
        <Card>
            <Card.Title title={`Bác sĩ ${dr.last_name} ${dr.first_name}`}></Card.Title>
            <Card.Content>
                <View><Image
                    style={{ height: 50, width: 50, borderRadius: 50 }}
                    source={{ uri: dr.avatar }}
                /></View>
                <Text >Bác sĩ {dr.last_name} {dr.first_name}</Text>
                <Text >Chuyên khoa: {dr.specialization_name}</Text>

            </Card.Content>
            <Card.Actions>
                <Button>Đặt lịch khám</Button>
            </Card.Actions>
        </Card>
    );

    return (
        <SafeAreaView>
            <Text>Danh sách bác sĩ</Text>

            <FlatList data={doctor} renderItem={({ item }) => (renderDoctor(item))} />
        </SafeAreaView>);
};

export default DoctorBooking;