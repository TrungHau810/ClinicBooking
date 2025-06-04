import React, { useEffect, useState } from "react";
import { View, FlatList, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { endpoints } from "../../configs/Apis";
import HealthRecordCard from "../../components/HealthRecordCard";

const PatientHealthRecords = ({ navigation }) => {
  const [ records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRecords = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await Apis.get(endpoints["healthrecords"], {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecords(res.data);
    } catch (err) {
      console.error("Lỗi khi tải hồ sơ bệnh nhân:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate("PatientHealthRecordDetail", { record: item })}
    >
      <HealthRecordCard record={item} />
    </TouchableOpacity>
  );

  if (loading) return <ActivityIndicator size="large" color="#1E90FF" style={{ marginTop: 20 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧾 Hồ sơ bệnh nhân đã đặt lịch</Text>
      <FlatList
        data={records}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>Không có hồ sơ nào</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  empty: { textAlign: "center", color: "#999", marginTop: 20 },
});

export default PatientHealthRecords;
