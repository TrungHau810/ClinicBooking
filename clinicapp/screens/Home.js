import { useEffect, useState } from "react";
import { FlatList, Image, ScrollView, TouchableOpacity, View } from "react-native";
import { Button, List, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import Apis, { endpoints } from "../configs/Apis";



const Home = ({ navigation }) => {

    const [hospital, setHospital] = useState([]);

    const loadingHospital = async () => {
        let res = await Apis.get(endpoints['hospitals']);
        setHospital(res.data);
    }

    useEffect(() => {
        loadingHospital();
    }, []);


    return (
        <SafeAreaView>
            <Text>Chào mừng đến TH Care </Text>
            <View>
                <Button mode="contained" onPress={() => navigation.navigate('doctorbooking')}>Đặt khám bác sĩ</Button>
            </View>

            {/* <TouchableOpacity onPress={navigation.navigate('profile')}>
                <Button mode="contained">Đặt lịch khám</Button>
            </TouchableOpacity> */}
            <FlatList data={hospital} renderItem={({ item }) => (
                <TouchableOpacity onPress={()=> {navigation.navigate('hospitaldetails', {'hospitalId': item.id})}}>
                    <List.Item
                        title={item.name}
                        description={`${item.address} \n ${item.phone}`}
                        left={() => <Image style={{ width: 50, height: 50, borderRadius: 8, marginRight: 10 }} source={{ uri: item.image }} />} />
                </TouchableOpacity>
            )} />



        </SafeAreaView>
    );
}

export default Home;