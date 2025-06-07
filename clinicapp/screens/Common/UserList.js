import { List, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/Header";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { endpoints } from "../../configs/Apis";
import { useNavigation } from "@react-navigation/native";
import { Image } from "react-native";



const UserList = () => {

    const [user, setUser] = useState([]);
    const nav = useNavigation();

    const loadUser = async () => {
        let currentUser = await AsyncStorage.getItem('currentUser');
        let res;
        currentUser = JSON.parse(currentUser);

        const headers = {
            Authorization: `Bearer ${currentUser.token}`,
        };

        if (currentUser.role === 'patient') {
            res = await Apis.get(endpoints['user-doctors'], { headers });
        } else if (currentUser.role === 'doctor') {
            res = await Apis.get(endpoints['user-patients'], { headers });
        }
        console.log("Kiểu dữ liệu:", typeof res.data, "Độ dài:", res.data.length);
        console.log(res.data);
        setUser(res.data);
    };

    useEffect(() => {
        console.log("useEffect chạy");
        loadUser();
    }, []);

    return (
        <SafeAreaView>
            <Header title={"Đoạn chat"} />
            {user.map((u) => (
                <List.Item
                    key={u.id}
                    title={u.full_name}
                    description={u.email}
                    left={() => (
                        <Image
                            source={{ uri: u.avatar }}
                            style={{ width: 40, height: 40, borderRadius: 20, margin: 8 }}
                        />
                    )}
                    onPress={() => nav.navigate('ChatScreen', { selectedUser: u })}
                />
            ))}
        </SafeAreaView>
    );
};

export default UserList;