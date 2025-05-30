import React, { useState } from "react";
import { ScrollView, StyleSheet, Alert, View, KeyboardAvoidingView, Platform } from "react-native"; // Thêm Alert ở đây
import { Text, TextInput, Button, HelperText, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import Apis, { endpoints } from "../../configs/Apis";

const ResetPassword = () => {
  const [otpLoading, setOtpLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [otp, setOTP] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const { colors } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validate = () => {
    if (newPassword !== confirm) {
      setMsg("Mật khẩu không khớp");
      return false;
    }
    return true;
  };

  const requestOTP = async () => {
    if (!email.trim()) {
      setMsg("Vui lòng nhập Email!");
      return;
    }
    setMsg("");
    try {
      setOtpLoading(true);
      const res = await Apis.post(endpoints["reset-password-otp"], { email });
      setMsg("Đã gửi mã OTP về email.");
      Alert.alert("Thành công", "Mã OTP đã được gửi về email của bạn.");
    } catch (error) {
      setMsg("Không thể gửi OTP. Vui lòng thử lại.");
      Alert.alert("Lỗi", "Không thể gửi OTP. Vui lòng kiểm tra lại email.");
      console.error(error);
    } finally {
      setOtpLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!validate()) {
      Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      setResetLoading(true);
      const res = await Apis.post(endpoints["reset-password-confirm"], {
        email,
        otp,
        new_password: newPassword,
      });

      setMsg("Mật khẩu đã được đặt lại thành công.");
      Alert.alert("Thành công", "Mật khẩu của bạn đã được cập nhật.");
    } catch (error) {
      setMsg("Không thể đặt lại mật khẩu. Kiểm tra thông tin và thử lại.");
      Alert.alert("Lỗi", "Không thể đặt lại mật khẩu. Kiểm tra OTP và thông tin.");
      console.error(error);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={60} // Tuỳ theo thanh header có hay không
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Khôi phục mật khẩu</Text>
          <Text style={styles.subtitle}>Vui lòng nhập email và làm theo hướng dẫn</Text>

          {msg !== "" && (
            <HelperText type="error" visible={true}>
              {msg}
            </HelperText>
          )}

          <TextInput
            label="Email"
            underlineColor="transparent"
            mode="flat"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            left={<TextInput.Icon icon="email" />}
            theme={{
              colors: {
                primary: colors.accent, // màu khi focus
                text: colors.text,       // màu chữ nhập
                placeholder: "#333",     // màu label khi chưa focus
              },
            }}
          />

          <Button mode="contained" onPress={requestOTP}
            loading={otpLoading} disabled={otpLoading}
            style={[styles.button, { marginBottom: 20 }]}>
            Gửi mã OTP
          </Button>

          <TextInput
            label="Mã OTP"
            underlineColor="transparent"
            mode="flat"
            value={otp}
            onChangeText={setOTP}
            style={styles.input}
            left={<TextInput.Icon icon="numeric" />}
            theme={{
              colors: {
                primary: colors.accent, // màu khi focus
                text: colors.text,       // màu chữ nhập
                placeholder: "#333",     // màu label khi chưa focus
              },
            }}
          />

          <TextInput
            label="Mật khẩu mới"
            underlineColor="transparent"
            mode="flat"
            value={newPassword}
            onChangeText={setNewPassword}
            style={styles.input}
            secureTextEntry={!showPassword}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            theme={{
              colors: {
                primary: colors.accent, // màu khi focus
                text: colors.text,       // màu chữ nhập
                placeholder: "#333",     // màu label khi chưa focus
              },
            }}
          />

          <TextInput
            label="Xác nhận lại mật khẩu"
            underlineColor="transparent"
            mode="flat"
            secureTextEntry={!showConfirmPassword} 
            value={confirm}
            onChangeText={setConfirm}
            style={styles.input}
            left={<TextInput.Icon icon="lock-reset" />}
            right={
              <TextInput.Icon
                icon={showConfirmPassword ? "eye-off" : "eye"}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            }
            theme={{
              colors: {
                primary: colors.accent,
                text: colors.text,
                placeholder: "#333",
              },
            }}
          />

          <Button mode="contained"
            loading={resetLoading} disabled={resetLoading}
            onPress={resetPassword} style={styles.button}>
            Đặt lại mật khẩu
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1, // quan trọng để ScrollView tự co giãn với nội dung
    backgroundColor: "#f5f6fa",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#2f3640",
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    color: "#636e72",
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    marginBottom: 5,
  },
  button: {
    paddingVertical: 5,
    backgroundColor: '#17A2F3',
  },
});

export default ResetPassword;
