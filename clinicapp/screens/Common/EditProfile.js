import { useContext, useEffect, useState } from "react";
import { View, StyleSheet, Image, Alert, TouchableOpacity } from "react-native";
import { Text, TextInput, Button, Avatar } from "react-native-paper";
import { MyUserContext } from "../../configs/MyContexts";
import Apis, { endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

const EditProfile = ({ navigation }) => {
    const user = useContext(MyUserContext);
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState({
        full_name: "",
        email: "",
        number_phone: "",
        username: "",
    });
    const form = new FormData();

    useEffect(() => {
        if (user?.payload) {
            setProfile({
                full_name: user.payload.full_name,
                email: user.payload.email,
                number_phone: user.payload.number_phone,
                username: user.payload.username,
            });
        }
    }, [user]);

    const addInfo = (field, value) => {
        setProfile({ ...profile, [field]: value });
    };

    const changeProfile = async () => {
        setLoading(true);
        const token = await AsyncStorage.getItem('token');
        try {
            form.append('username', profile.username);
            form.append('full_name', profile.full_name);
            form.append('number_phone', profile.number_phone);
            form.append('email', profile.email);
            form.append('role', 'patient');
            console.log(form);

            const res = await Apis.patch(endpoints['current-user'], form, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            console.log(res);
            Alert.alert("Thành công", "Chỉnh sửa thông tin thành công");
        } catch (error) {
            console.error(error);
            console.log(formData);
            console.log(token);
            Alert.alert("Thất bại", "Đã xảy ra lỗi!\nVui lòng thử lại.")
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Avatar.Image
                size={100}
                source={{ uri: user.payload.avatar }}
                style={styles.avatar}
            />
            <TextInput
                label="Họ tên"
                value={profile.full_name}
                onChangeText={(text) => addInfo("full_name", text)}
                style={styles.input}
            />
            <TextInput
                label="Email"
                value={profile.email}
                onChangeText={(text) => addInfo("email", text)}
                keyboardType="email-address"
                style={styles.input}
            />
            <TextInput
                label="Số điện thoại"
                value={profile.number_phone}
                onChangeText={(text) => addInfo("number_phone", text)}
                keyboardType="phone-pad"
                style={styles.input}
            />
            <TextInput
                label="Tên đăng nhập"
                value={profile.username}
                onChangeText={(text) => addInfo("username", text)}
                style={styles.input}
            />
            <Text style={styles.role}>Vai trò: {user.payload.role === "patient" ? "Bệnh nhân" : "Bác sĩ"}</Text>

            <Button disabled={loading} loading={loading} mode="contained"
                onPress={changeProfile} style={styles.button}>
                Lưu thay đổi
            </Button>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    title: {
        fontSize: 20,
        marginBottom: 20,
        fontWeight: "bold",
        textAlign: "center",
    },
    avatar: {
        alignSelf: "center",
        marginBottom: 20,
    },
    input: {
        marginBottom: 10,
    },
    role: {
        marginVertical: 10,
        fontStyle: "italic",
        textAlign: "center",
    },
    button: {
        marginTop: 20,
    },
});

export default EditProfile;
