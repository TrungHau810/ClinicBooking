// screens/SplashScreen.js
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const SplashScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkLogin = async () => {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                // Nếu có token, chuyển đến màn hình chính (home)
                navigation.replace('Home');  // Thay 'Home' bằng tên màn hình bạn muốn
            } else {
                // Nếu không có token, chuyển đến màn hình đăng nhập
                navigation.replace('Login');
            }
            setLoading(false);
        };

        checkLogin();
    }, []);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return null; // Splash screen không hiển thị gì khi đã hoàn thành kiểm tra
};

export default SplashScreen;
