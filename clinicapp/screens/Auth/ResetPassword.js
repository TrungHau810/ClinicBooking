import React, { useState } from "react";
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { Text, TextInput, Button, HelperText } from "react-native-paper";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [otp, setOTP] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");

  const handleSendOTP = () => {
    if (!email.includes("@")) {
      setError("Vui lòng nhập email hợp lệ!");
    } else {
      setError("");
      // TODO: Gửi OTP qua email ở đây
      console.log("Đã gửi OTP tới:", email);
    }
  };

  const handleVerifyOTP = () => {
    if (!otp || !newPassword) {
      setError("Vui lòng nhập mã OTP và mật khẩu mới!");
    } else {
      setError("");
      // TODO: Xác minh mã OTP và đổi mật khẩu ở đây
      console.log("OTP:", otp, "New Password:", newPassword);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>🔐 Khôi phục mật khẩu</Text>
        <Text style={styles.subtitle}>Vui lòng nhập email và làm theo hướng dẫn</Text>

        <TextInput
          label="Email"
          mode="outlined"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          left={<TextInput.Icon icon="email" />}
        />

        <Button mode="contained" onPress={handleSendOTP} style={styles.button}>
          Gửi mã OTP
        </Button>

        <TextInput
          label="Mã OTP"
          mode="outlined"
          value={otp}
          onChangeText={setOTP}
          style={styles.input}
          left={<TextInput.Icon icon="numeric" />}
        />

        <TextInput
          label="Mật khẩu mới"
          mode="outlined"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          style={styles.input}
          left={<TextInput.Icon icon="lock-reset" />}
        />

        {error !== "" && (
          <HelperText type="error" visible={true}>
            {error}
          </HelperText>
        )}

        <Button mode="contained" onPress={handleVerifyOTP} style={styles.button}>
          Đặt lại mật khẩu
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    justifyContent: "center",
    flexGrow: 1,
    backgroundColor: "#f5f6fa",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#2f3640",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    color: "#636e72",
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 10,
    paddingVertical: 5,
  },
});

export default ResetPassword;
