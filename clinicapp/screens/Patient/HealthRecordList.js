
import React, { useEffect, useState } from "react";
import { View, FlatList, StyleSheet, Text, TouchableOpacity } from "react-native";
import { Button, Card } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { endpoints } from "../../configs/Apis";
import { SafeAreaView } from "react-native-safe-area-context";

const HealthRecordList = ({ navigation }) => {
  const [records, setRecords] = useState([]);

  const loadRecords = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await Apis.get(endpoints["healthrecords"], {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRecords(res.data);
    } catch (error) {
      console.error("Lỗi khi tải hồ sơ:", error);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Text>{item.full_name}</Text>
        <Text>Giới tính: {item.gender === "male" ? "Nam" : "Nữ"}</Text>
        <Text>Ngày sinh: {item.day_of_birth}</Text>
        <Text>Email: {item.email}</Text>
        <Text>Điện thoại: {item.number_phone}</Text>
        <Text>Nghề nghiệp: {item.occupation}</Text>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.navigate("HealthRecord")}>
          <Button mode="contained">Tạo hồ sơ sức khỏe mới</Button>
        </TouchableOpacity>

        <Text style={styles.title}>Danh sách hồ sơ</Text>
        <FlatList
          data={records}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  card: {
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
  },
});

export default HealthRecordList;
