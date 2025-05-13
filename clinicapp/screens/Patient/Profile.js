// import { useContext } from "react";
// import { Button, Text } from "react-native-paper";
// import { MyDispatchContext, MyUserContext } from "../../configs/MyContexts";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { Image, TouchableOpacity } from "react-native";


// const Profile = ({ navigation }) => {

//     const user = useContext(MyUserContext);
//     const dispatch = useContext(MyDispatchContext);

//     const logout = () => {
//         // dispatch({
//         //     'type': 'logout'
//         // });
//         // navigation.navigate('home');
//     };

//     return (
//         <SafeAreaView>
//             <Text>Trang thông tin cá nhân</Text>
//             <Image style={{ width: 100, height: 100, borderRadius: 50 }} source={{ uri: user.payload.avatar }} />
//             <Text>{`Xin chào ${user.payload.last_name} ${user.payload.first_name}!`}</Text>

//             <TouchableOpacity onPress={() => logout}><Button mode="contained-tonal">Đăng xuất</Button></TouchableOpacity>
//         </SafeAreaView>

//     );

// };

// export default Profile;


import { useContext } from "react";
import { Button, Text, Divider } from "react-native-paper";
import { MyDispatchContext, MyUserContext } from "../../configs/MyContexts";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image, StyleSheet, View, TouchableOpacity } from "react-native";

const Profile = ({ navigation }) => {
    const user = useContext(MyUserContext);
    const dispatch = useContext(MyDispatchContext);

    const logout = () => {
        dispatch({ type: 'logout' });
        navigation.navigate('home');
    };

    // const { avatar, username, full_name, email} = user.payload;
    const { avatar, username, full_name, number_phone, email } = user?.payload || {};
    console.log(user.payload);
    let content;

    if (user.payload !== undefined) {
        content = (
            <SafeAreaView>
                <Text style={styles.header}>Thông tin cá nhân</Text>

                <View style={styles.avatarContainer}>
                    <Image style={styles.avatar} source={{ uri: avatar }} />
                    <Text style={styles.name}>{full_name}</Text>
                </View>

                <Divider style={styles.divider} />

                <View style={styles.infoSection}>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Tên đăng nhập: </Text>
                        <Text style={styles.value}>{username}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Số điện thoại: </Text>
                        <Text style={styles.value}>{number_phone}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Email: </Text>
                        <Text style={styles.value}>{email || "Chưa cập nhật"}</Text>
                    </View>
                </View>

                <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                    <Button mode="contained-tonal">Đăng xuất</Button>
                </TouchableOpacity>
            </SafeAreaView>
        );
    } else {
        content = (
            <SafeAreaView>
                <Text>Vui lòng đăng nhập để sử dụng</Text>
                <TouchableOpacity onPress={() => navigation.navigate("login")}>
                    <Button>Đăng nhập</Button>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {content}
        </SafeAreaView>
    );

};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: "#fff",
        flex: 1,
    },
    header: {
        fontSize: 22,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 20,
    },
    avatarContainer: {
        alignItems: "center",
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    name: {
        marginTop: 10,
        fontSize: 18,
        fontWeight: "600",
    },
    divider: {
        marginVertical: 16,
    },
    infoSection: {
        paddingHorizontal: 10,
    },
    label: {
        fontWeight: "600",
        fontSize: 16,
        marginTop: 10,
    },
    value: {
        fontSize: 16,
        color: "#333",
    },
    logoutBtn: {
        marginTop: 30,
        alignItems: "center",
    }, infoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    label: {
        fontWeight: "600",
        fontSize: 16,
        minWidth: 120, // cố định chiều rộng nhãn để canh đều
    },
    value: {
        fontSize: 16,
        color: "#333",
        flexShrink: 1, // tránh tràn dòng với email dài
    },
});

export default Profile;
