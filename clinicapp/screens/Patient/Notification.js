import { useContext, useEffect, useState } from "react";
import { View, StyleSheet, FlatList, Platform, StatusBar, Image } from "react-native";
import { Card, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MyDispatchContext, MyUserContext } from "../../configs/MyContexts";
import Apis, { endpoints } from "../../configs/Apis";
import { useNotification } from "../../configs/NotificationContext";
import RenderHTML from "react-native-render-html";

const Notification = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { setCount } = useNotification();

    const loadNotification = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const res = await Apis.get(endpoints["notifications"]);
            setNotifications(res.data);
            setCount(res.data.length);
        } catch (err) {
            console.error("Lỗi khi load thông báo: ", err);
        } finally {
            if (isRefresh) setRefreshing(false);
            else setLoading(false);
        }
    };


    useEffect(() => {
        loadNotification();
    }, []);

    const renderItem = ({ item }) => (
        <View style={styles.recordBox}>
            <Card style={styles.card}>
                <Card.Content style={styles.cardContent}>
                    <Image source={require('../../assets/notification.jpg')} style={styles.image} />
                    <View style={styles.textContainer}>
                        <Text style={styles.type}>{item.title.toUpperCase()}</Text>
                        <RenderHTML source={{ html: item.content }} />
                        <Text style={styles.date}>
                            Gửi lúc: {new Date(item.send_at).toLocaleString()}
                        </Text>
                    </View>
                </Card.Content>
            </Card>
        </View>

    );

    return (
        <View style={styles.container}>
            <View style={styles.headerWrapper}>
                <StatusBar barStyle="light-content" backgroundColor="#1E90FF" />
                <View>
                    <Text style={styles.title}>Danh sách thông báo</Text>
                </View>
            </View>
            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                refreshing={refreshing} // <-- hiệu ứng vòng quay
                onRefresh={() => loadNotification(true)} // <-- gọi lại API
                ListEmptyComponent={<Text>Không có thông báo nào.</Text>}
            />

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#fff",
        flex: 1,
    },
    card: {
        backgroundColor: "#f6f6f6",
        borderRadius: 10,
    },
    type: {
        fontWeight: "bold",
        marginBottom: 4,
    },
    date: {
        color: "#888",
        marginTop: 6,
        fontSize: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 10,
        textAlign: "center",
        color: "#fff",
    },
    headerWrapper: {
        backgroundColor: '#1E90FF', // xanh dương
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 44, // tránh đè status bar (44 cho iPhone notch)
        paddingBottom: 10,
        width: '100%',
    },
    recordBox: {
        borderWidth: 1,
        borderColor: "#000",
        borderRadius: 10,
        backgroundColor: "#fff",
        marginBottom: 1,
        marginTop: 7,
        marginHorizontal: 10,
    },
    image: {
        width: 90,
        height: 90,
        borderRadius: 8,
        marginBottom: 5,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    textContainer: {
        marginLeft: 12,
        flex: 1,
        flexShrink: 1,
    },
});
export default Notification;