// import { ScrollView, Text, View, Alert } from "react-native";
// import { Button, HelperText, TextInput } from "react-native-paper";
// import { SafeAreaView } from "react-native-safe-area-context";
// import MyStyles from "../../styles/MyStyles";
// import { useContext, useState } from "react";
// import Apis, { authApis, endpoints } from "../../configs/Apis";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { MyDispatchContext } from "../../configs/MyContexts";


// const Login = ({ navigation }) => {

//     const info = [{
//         label: "Tên đăng nhập",
//         field: "username",
//         secureTextEntry: false,
//         icon: "text"
//     }, {
//         label: "Mật khẩu",
//         field: "password",
//         secureTextEntry: true,
//         icon: "eye"
//     }];

//     const [msg, setMsg] = useState();
//     const [user, setUser] = useState({});
//     const [loading, setLoading] = useState(false);
//     const dispatch = useContext(MyDispatchContext);


//     const setState = (value, field) => {
//         setUser({ ...user, [field]: value });
//     };

//     const validate = () => {
//         if (Object.values(user).length === 0) {
//             setMsg("Vui lòng nhập thông tin để đăng nhập!");
//             return false;
//         }

//         for (let i of info)
//             if (user[i.field] === '') {
//                 setMsg(`Vui lòng nhập ${i.label}`);
//                 return false;
//             }

//         setMsg('');
//         return true;
//     };

//     const login = async () => {

//         if (validate() === true) {
//             try {
//                 setLoading(true);

//                 let res = await Apis.post(endpoints['login'], {
//                     ...user,
//                     'client_id': 'NTWbn6Ws0BboQonlGDkgzDIB67CyBg7qrinoRt72',
//                     'client_secret': 'u7IOJXTyVB69alsb1JgxYZNqyCGFwR4baCqpJRlbAOFa1XRpK3qpU05YJnN5EWruQebXHTQF6SywwcQtIFvukVBl4W058Gan9x3sj1j3LXIQ6XLiFRp6aI1zRGY8XPLC',
//                     'grant_type': 'password'
//                 });


//                 await AsyncStorage.setItem('token', res.data.access_token);
//                 let u = await authApis(res.data.access_token).get(endpoints['current-user']);
//                 console.info(u.data);

//                 dispatch({
//                     "type": "login",
//                     "payload": u.data
//                 });

//                 navigation.navigate("Patient");

//             } catch (ex) {
//                 // console.error(ex);
//                 // Alert.alert("Đăng nhập thất bại", "Tên đăng nhập hoặc mật khẩu không đúng!");
//                 let message = ("Đăng nhập thất bại", "Tên đăng nhập hoặc mật khẩu không đúng!");

//                 if (ex.response && ex.response.data) {
//                     // Nếu backend trả về thông báo cụ thể, lấy ra
//                     message = ex.response.data.detail || message;
//                     Alert.alert("Đăng nhập thất bại", "Tên đăng nhập hoặc mật khẩu không đúng!");

//                 }
//             } finally {
//                 setLoading(false);
//             }
//         }

//     };

//     return (
//         <SafeAreaView contentContainerStyle={MyStyles.container}>
//             <Text style={MyStyles.title}>Đăng nhập hệ thống</Text>
//             <Text style={MyStyles.subtitle}>
//                 Đặt lịch khám trực tuyến nhanh chóng và dễ dàng
//             </Text>
//             <HelperText style={MyStyles.m} type="error" visible={msg}>
//                 {msg}
//             </HelperText>
//             <View style={MyStyles.form}>
//                 {info.map(i => <TextInput
//                     key={`${i.label}+${i.field}`}
//                     onChangeText={t => setState(t, i.field)}
//                     label={i.label}
//                     secureTextEntry={i.secureTextEntry}
//                     right={<TextInput.Icon icon={i.icon} />}
//                 />)}
//             </View>

//             <Button loading={loading} disabled={loading} onPress={login} style={MyStyles.button} mode="contained">
//                 Đăng nhập
//             </Button>
//             <Button onPress={() => { navigation.navigate('Đăng ký') }} labelStyle={{ color: '#6200ee' }}>
//                 Chưa có tài khoản? Đăng ký
//             </Button>

//         </SafeAreaView>
//     );

// };

// export default Login;


import { useContext, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { Button, HelperText, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import MyStyles from "../../styles/MyStyles";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import { MyDispatchContext } from "../../configs/MyContexts";

const Login = ({ navigation }) => {
  const [user, setUser] = useState({ username: "", password: "" });
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useContext(MyDispatchContext);

  const handleInputChange = (field, value) => {
    setUser(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!user.username || !user.password) {
      setErrorMsg("Vui lòng điền đầy đủ thông tin!");
      return false;
    }
    setErrorMsg("");
    return true;
  };

  const login = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const res = await Apis.post(endpoints["login"], {
        ...user,
        client_id: "NTWbn6Ws0BboQonlGDkgzDIB67CyBg7qrinoRt72",
        client_secret: "u7IOJXTyVB69alsb1JgxYZNqyCGFwR4baCqpJRlbAOFa1XRpK3qpU05YJnN5EWruQebXHTQF6SywwcQtIFvukVBl4W058Gan9x3sj1j3LXIQ6XLiFRp6aI1zRGY8XPLC",
        grant_type: "password",
      });

      await AsyncStorage.setItem("token", res.data.access_token);

      const userRes = await authApis(res.data.access_token).get(endpoints["current-user"]);

      dispatch({
        type: "login",
        payload: userRes.data,
      });

      navigation.navigate("Patient");

    } catch (ex) {
      console.error(ex);
      const message =
        ex.response?.data?.detail || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!";
      Alert.alert("Lỗi đăng nhập", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={MyStyles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={MyStyles.title}>Đăng nhập hệ thống</Text>
        <Text style={MyStyles.subtitle}>
          Đặt lịch khám trực tuyến nhanh chóng và dễ dàng
        </Text>

        {errorMsg !== "" && (
          <HelperText type="error" visible={true}>
            {errorMsg}
          </HelperText>
        )}

        <TextInput
          label="Tên đăng nhập"
          value={user.username}
          onChangeText={(text) => handleInputChange("username", text)}
          mode="outlined"
          left={<TextInput.Icon icon="account" />}
          style={MyStyles.input}
        />

        <TextInput
          label="Mật khẩu"
          value={user.password}
          onChangeText={(text) => handleInputChange("password", text)}
          mode="outlined"
          secureTextEntry={!showPassword}
          left={<TextInput.Icon icon="lock" />}
          right={
            <TextInput.Icon
              icon={showPassword ? "eye-off" : "eye"}
              onPress={() => setShowPassword(!showPassword)}
            />
          }
          style={MyStyles.input}
        />

        <Button
          mode="contained"
          onPress={login}
          loading={loading}
          disabled={loading}
          style={MyStyles.button}
        >
          Đăng nhập
        </Button>

        <Button
          onPress={() => navigation.navigate("Đăng ký")}
          labelStyle={{ color: "#6200ee" }}
        >
          Chưa có tài khoản? Đăng ký
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Login;
