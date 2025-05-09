import { useContext } from "react";
import { Button, Text } from "react-native-paper";
import { MyDispatchContext, MyUserContext } from "../../configs/MyContexts";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image, TouchableOpacity } from "react-native";


const Profile = ({ navigation }) => {

    const user = useContext(MyUserContext);
    const dispatch = useContext(MyDispatchContext);

    const logout = () => {
        // dispatch({
        //     'type': 'logout'
        // });
        // navigation.navigate('home');
    };

    return (
        <SafeAreaView>
            <Text>Trang thông tin cá nhân</Text>
            <Image style={{ width: 100, height: 100, borderRadius: 50 }} source={{ uri: user.payload.avatar }} />
            <Text>{`Xin chào ${user.payload.last_name} ${user.payload.first_name}!`}</Text>

            <TouchableOpacity onPress={() => logout}><Button mode="contained-tonal">Đăng xuất</Button></TouchableOpacity>
        </SafeAreaView>

    );

};

export default Profile;