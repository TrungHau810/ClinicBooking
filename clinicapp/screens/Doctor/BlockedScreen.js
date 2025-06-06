import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { IconButton, Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";

const BlockedScreen = () => {
  const navigation = useNavigation();

  const handleNavigateToUpload = () => {
    navigation.navigate("UploadLicense");
  };

  return (
    <View style={styles.container}>
      <IconButton
        icon="alert-circle-outline"
        size={64}
        iconColor="#f44336"
        style={styles.icon}
      />
      <Text style={styles.title}>Tài khoản chưa được xác minh</Text>
      <Text style={styles.message}>
        Vui lòng chờ quản trị viên phê duyệt hoặc tải lên giấy phép hành nghề để được xác minh.
      </Text>

      <Button
        mode="contained"
        onPress={handleNavigateToUpload}
        style={styles.button}
        buttonColor="#1565C0"
      >
        Tải lên giấy phép hành nghề
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  icon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f44336",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  button: {
    marginTop: 12,
    width: "80%",
    borderRadius: 8,
  },
});

export default BlockedScreen;
