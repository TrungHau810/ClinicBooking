import { Button, Card, RadioButton, Text, TextInput, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import MyStyles from "../../styles/MyStyles";
import { Image, ScrollView, StyleSheet, TouchableOpacity, View, KeyboardAvoidingView, Platform } from "react-native";
import { useEffect, useState } from "react";
import * as ImagePicker from 'expo-image-picker'
import Apis, { endpoints } from "../../configs/Apis";


const info = [
    { field: "username", label: "Tên đăng nhập", secureTextEntry: false, icon: "account" },
    { field: "full_name", label: "Họ tên đầy đủ", secureTextEntry: false, icon: "text" },
    { field: "number_phone", label: "Số điện thoại", secureTextEntry: false, icon: "text" },
    { field: "email", label: "Email", secureTextEntry: false, icon: "email" },
    { field: "avatar", label: "Ảnh đại diện", secureTextEntry: false, icon: "camera" },
    { field: "password", label: "Mật khẩu", secureTextEntry: true, icon: "eye" },
    { field: "confirm_password", label: "Xác nhận lại mật khẩu", secureTextEntry: true, icon: "eye" }
];

const Register = ({ navigation }) => {
    const { colors } = useTheme();
    const [showPassword, setShowPassword] = useState({});
    const [userType, setUserType] = useState('patient'); // 'patient' or 'doctor'
    const [user, setUser] = useState({});
    const [loading, setLoading] = useState(false);
    const setState = (value, field) => {
        setUser({ ...user, [field]: value });
    };


    const pick = async () => {
        let { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            alert("Permissions denied!");
        } else {
            const result = await ImagePicker.launchImageLibraryAsync();

            if (!result.canceled) {
                setState(result.assets[0], "avatar");
            }
        }
    }


    const renderForm = (infoArray) => {
        return infoArray.map(item => {
            if (item.field === 'avatar') {
                return (
                    <View key={item.field} >
                        <Text style={styles.label}>Chọn ảnh đại diện</Text>
                        <TouchableOpacity style={styles.avatarWrapper} onPress={pick}>
                            {user.avatar ? (
                                <Image source={{ uri: user.avatar.uri }} style={styles.avatar} />
                            ) : (
                                <Text>Chưa có avatar</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                );

            } else {
                return (
                    <View key={item.field} style={styles.inputContainer}>
                        <Text style={styles.label}>{item.label}</Text>
                        <TextInput
                            style={styles.input}
                            underlineColor="transparent"
                            placeholder={item.label}
                            //secureTextEntry={item.secureTextEntry}
                            // value={formData[input.field]}
                            onChangeText={t => setState(t, item.field)}
                            secureTextEntry={!!item.secureTextEntry && !showPassword[item.field]}
                            left={item.secureTextEntry ? undefined : <TextInput.Icon icon={item.icon} />}
                            right={item.secureTextEntry && (
                                <TextInput.Icon
                                    icon={showPassword[item.field] ? "eye-off" : "eye"}
                                    onPress={() =>
                                        setShowPassword(prev => ({
                                            ...prev,
                                            [item.field]: !prev[item.field]
                                        }))
                                    }
                                />
                            )}
                            theme={{
                                colors: {
                                    primary: colors.accent, // màu khi focus
                                    text: colors.text,       // màu chữ nhập
                                    placeholder: "#333",     // màu label khi chưa focus
                                },
                            }}
                        />
                    </View>
                );

            }
        });
    };



    const register = async () => {
        try {
            setLoading(true);
            console.log(user);
            let form = new FormData();
            for (let key in user) {
                console.log(key)
                if (key !== 'confirm_password')
                    if (key === 'avatar') {
                        form.append(key, {
                            uri: user.avatar.uri,
                            name: user.avatar.fileName,
                            type: user.avatar.type
                        })
                    } else {
                        form.append(key, user[key]);
                    }
            }
            console.log("Dữ liệu người dùng:", form);
            let res = await Apis.post(endpoints['register'], form, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (res.status === 201)
                console.info("Đăng ký thành công");

        } catch (error) {
            console.info(error);
        } finally {
            setLoading(false)
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={50} // tùy chỉnh để tránh header hoặc tab bar bị đẩy lên
        >
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" >
                <Text style={styles.title}>Đăng ký tài khoản</Text>

                {renderForm(info)}

                <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Loại tài khoản</Text>
                    <RadioButton.Group onValueChange={setUserType} value={userType}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <RadioButton value="patient" color='#17A2F3' />
                            <Text style={{ marginRight: 20 }}>Bệnh nhân</Text>

                            <RadioButton value="doctor" color='#17A2F3' />
                            <Text>Bác sĩ</Text>
                        </View>
                    </RadioButton.Group>
                </View>


                <TouchableOpacity onPress={register}><Button mode="contained" style={styles.button}>Đăng ký</Button></TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default Register;

const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingBottom: 50
    },
    title: {
        fontSize: 24,
        textAlign: 'center',
        marginBottom: 25
    },
    inputContainer: {
        marginBottom: 15,
    },
    label: {
        fontSize: 15,
        marginBottom: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: '#aaa',
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
    },
    avatarWrapper: {
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e9e9e9',
        borderRadius: 10,
        marginBottom: 10
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    button: {
    backgroundColor: '#17A2F3'
  },
});