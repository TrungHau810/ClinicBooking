import { useContext, useState } from "react";
import { Alert, ScrollView, Text, View, StyleSheet, ImageBackground, StatusBar, KeyboardAvoidingView, Platform } from "react-native";
import { Button, HelperText, TextInput, useTheme } from "react-native-paper";
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
  const { colors } = useTheme();

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
      await AsyncStorage.setItem("currentUser", JSON.stringify(userRes.data));

      dispatch({
        type: "login",
        payload: userRes.data,
      });
      if (userRes.data.role === 'patient') {
        navigation.navigate("Patient");
      } else if (userRes.data.role === 'doctor') {
        navigation.navigate("Doctor");
      }
      else if (userRes.data.role === 'admin') {
        navigation.navigate("Admin");
      }
      console.log("Đăng nhập role:", userRes.data.role);

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
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={{ flex: 1 }}>
        <ImageBackground
          source={require("../../assets/clinicapp.jpg")}
          style={styles.background}
          resizeMode="cover"
        >
          <View style={styles.overlay} />
          <SafeAreaView style={{ flex: 1 }}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={{ flex: 1 }}
              keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 25}
            >
              <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.title}>Đăng nhập hệ thống</Text>
                <Text style={styles.subtitle}>
                  Đặt lịch khám trực tuyến nhanh chóng và dễ dàng
                </Text>

                {errorMsg !== "" && (
                  <HelperText type="error" visible={true}>
                    {errorMsg}
                  </HelperText>
                )}

                <TextInput
                  label="Tên đăng nhập"
                  underlineColor="transparent"
                  value={user.username}
                  onChangeText={(text) => handleInputChange("username", text)}
                  mode="flat"
                  left={<TextInput.Icon icon="account" />}
                  style={styles.input}
                // theme={{
                //   colors: {
                //     primary: colors.accent, // màu khi focus
                //     text: colors.text,       // màu chữ nhập
                //     placeholder: "#333",     // màu label khi chưa focus
                //   },
                // }}
                />

                <TextInput
                  label="Mật khẩu"
                  underlineColor="transparent"
                  value={user.password}
                  onChangeText={(text) => handleInputChange("password", text)}
                  mode="flat"
                  secureTextEntry={!showPassword}
                  left={<TextInput.Icon icon="lock" />}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? "eye-off" : "eye"}
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                  style={styles.input}
                // theme={{
                //   colors: {
                //     primary: colors.accent, // màu khi focus
                //     text: colors.text,       // màu chữ nhập
                //     placeholder: "#333",     // màu label khi chưa focus
                //   },
                // }}
                />

                <Button
                  mode="contained"
                  onPress={login}
                  loading={loading}
                  disabled={loading}
                  style={styles.button}
                >
                  Đăng nhập
                </Button>

                <Button style={styles.magrin}
                  onPress={() => navigation.navigate("Register")}
                  labelStyle={{ color: "#212121" }}
                >
                  Chưa có tài khoản? Đăng ký
                </Button>
                <Button
                  onPress={() => navigation.navigate("ResetPassword")}
                  labelStyle={{ color: "#212121" }}
                  style={[styles.magrin, { marginTop: -15 }]}
                >
                  Quên mật khẩu
                </Button>
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </ImageBackground>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: "#212121",
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 10

  },
  input: {
    // paddingLeft: 25,
    marginBottom: 10,
    backgroundColor: "white",
    borderRadius: 10,
  },
  button: {
    marginTop: 10,
    marginBottom: 0,
    backgroundColor: '#17A2F3'
  },
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  content: {
    zIndex: 1,
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  magrin: {
    margin: 10,
  },
});

export default Login;