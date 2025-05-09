import { Button, Card, RadioButton, Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import MyStyles from "../../styles/MyStyles";
import { Image, ScrollView, TouchableOpacity, View } from "react-native";
import { useState } from "react";
import * as ImagePicker from 'expo-image-picker'
import Apis, { endpoints } from "../../configs/Apis";


const infoCommon = [
    { field: "username", label: "Tên đăng nhập", secureTextEntry: false, icon: "account" },
    { field: "last_name", label: "Họ và tên lót", secureTextEntry: false, icon: "text" },
    { field: "first_name", label: "Tên", secureTextEntry: false, icon: "text" },
    { field: "email", label: "Email", secureTextEntry: false, icon: "email" },
    { field: "avatar", label: "Ảnh đại diện", secureTextEntry: false, icon: "camera" },
    {
        field: "gender", label: "Giới tính", secureTextEntry: false, icon: "gender-male-female",
        option: [
            { label: 'Nam', value: 'male' },
            { label: 'Nữ', value: 'female' }
        ]
    },
    { field: "password", label: "Mật khẩu", secureTextEntry: true, icon: "eye" },
    { field: "confirm_password", label: "Xác nhận lại mật khẩu", secureTextEntry: true, icon: "eye" }
];

const infoPatient = [
    ...infoCommon,
    { field: "day_of_birth", label: "Ngày sinh", secureTextEntry: false, icon: "calendar" },
    { field: "address", label: "Địa chỉ", secureTextEntry: false, icon: "map-marker" }
];

const infoDoctor = [
    ...infoCommon,
    { field: "biography", label: "Tiểu sử", secureTextEntry: false, icon: "text" },
    { field: "license_number", label: "Số giấy phép hành nghề", secureTextEntry: false, icon: "numeric" },
    { field: "license_image", label: "Giấy phép hành nghề", secureTextEntry: false, icon: "camera" }
];


const Register = ({ navigation }) => {

    const [userType, setUserType] = useState('patient'); // 'patient' or 'doctor'
    const [user, setUser] = useState({});
    const [loading, setLoading] = useState(false);
    const setState = (value, field) => {
        setUser({ ...user, [field]: value });
    };


    const pickImage = async (field) => {
        let { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            alert("Permissions denied!");
        } else {
            const result = await ImagePicker.launchImageLibraryAsync();
            if (!result.canceled) {
                setState(result.assets[0], field);
            }
        }
    };


    const renderForm = (infoArray) => {
        return infoArray.map(item => {
            if (item.field === 'avatar' || item.field === 'license_image') {
                return (
                    <View key={item.field} style={{ marginBottom: 12 }}>
                        <TouchableOpacity style={{ padding: 10, backgroundColor: '#eee', borderRadius: 8 }} onPress={() => pickImage(item.field)}>
                            <Text>Chọn {item.label.toLowerCase()}</Text>
                        </TouchableOpacity>

                        {user[item.field]?.uri && (
                            <Image source={{ uri: user[item.field].uri }} style={[MyStyles.avatar, MyStyles.m]} />
                        )}
                    </View>
                );
            }

            if (item.field === 'gender') {
                return (
                    <View key="gender" style={{ marginBottom: 12 }}>
                        <Text>{item.label}</Text>
                        <RadioButton.Group
                            onValueChange={value => setState(value, 'gender')}
                            value={user.gender}
                        >
                            <View style={{ flexDirection: 'row' }}>
                                {item.option.map(opt => (
                                    <View key={opt.value} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
                                        <RadioButton value={opt.value} />
                                        <Text>{opt.label}</Text>
                                    </View>
                                ))}
                            </View>
                        </RadioButton.Group>
                    </View>
                );
            }
            return (
                <TextInput
                    key={item.field}
                    value={user[item.field] || ''}
                    onChangeText={t => setState(t, item.field)}
                    label={item.label}
                    mode="outlined"
                    secureTextEntry={item.secureTextEntry}
                    left={<TextInput.Icon icon={item.icon} />}
                    style={{ marginBottom: 12 }}
                />
            );
        });
    };


    const register = async () => {
        try {
            setLoading(true);
            let form = new FormData();
            for (let key in user) {
                console.log(key)
                if (key !== 'confirm_password')
                    if (key === 'avatar' || key === 'license_image') {
                        form.append(key, {
                            uri: user[key]?.uri,
                            name: user[key]?.fileName || `${key}.jpg`,
                            type: user[key]?.type || 'image/jpeg',
                        });
                    } else {
                        form.append(key, user[key]);
                    }
            }
            console.log("Dữ liệu người dùng:", form);
            let res = await Apis.post(endpoints['patients'], form, {
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
        <SafeAreaView style={[MyStyles.background, { flex: 1 }]}>
            <View style={[MyStyles.row, MyStyles.slide]}>
                <TouchableOpacity style={[{ paddingRight: 20 }]} onPress={() => setUserType('patient')}>
                    <Text style={MyStyles.title}>Bệnh nhân</Text>
                </TouchableOpacity>
                <Text style={MyStyles.title}>|</Text>
                <TouchableOpacity style={{ paddingLeft: 20 }} onPress={() => setUserType('doctor')}>
                    <Text style={MyStyles.title}>Bác sĩ</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 16, backgroundColor: 'white' }}>
                <Card style={{ marginBottom: 20 }}>
                    <Card.Title title={`Đăng ký ${userType === 'patient' ? 'bệnh nhân' : 'bác sĩ'}`} />
                    <Card.Content>
                        {renderForm(userType === 'patient' ? infoPatient : infoDoctor)}
                    </Card.Content>
                </Card>
            </ScrollView>

            <View style={{ backgroundColor: 'white' }}>
                <TouchableOpacity>
                    <Button loading={loading} style={[MyStyles.m]} mode="contained" onPress={register}>
                        Đăng ký
                    </Button>
                </TouchableOpacity>
                <TouchableOpacity>
                    <Button onPress={() => { navigation.navigate('Đăng nhập') }}>Đã có tài khoản? Đăng nhập</Button>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default Register;