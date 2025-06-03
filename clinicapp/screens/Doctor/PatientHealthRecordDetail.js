import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { endpoints } from "../../configs/Apis";
import TestResultCard from "../../components/TestResultCard"; // Bạn cần tạo component này

const PatientHealthRecordDetail = ({ route }) => {
  const { record } = route.params;
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTestResults = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await Apis.get(`${endpoints["testresults"]}?health_record=${record.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTestResults(res.data);
    } catch (err) {
      console.error("Lỗi khi tải kết quả xét nghiệm:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTestResults();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🩺 Hồ sơ: {record.name}</Text>
      <Text style={styles.subtitle}>📋 Kết quả xét nghiệm</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#1E90FF" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={testResults}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <TestResultCard result={item} />}
          ListEmptyComponent={<Text style={styles.empty}>Không có kết quả xét nghiệm nào</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  subtitle: { fontSize: 18, fontWeight: "600", marginBottom: 10 },
  empty: { textAlign: "center", color: "#777", marginTop: 20 },
});

export default PatientHealthRecordDetail;
