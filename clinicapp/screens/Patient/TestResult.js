import React, { useEffect, useState } from "react";
import { View, FlatList, Text, StyleSheet, RefreshControl } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { endpoints } from "../../configs/Apis";
import TestResultCard from "../../components/TestResultCard";

const TestResult = ({ route }) => {
  const { healthRecordId, patientName } = route.params;
  const [results, setResults] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadTestResults = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await Apis.get(`${endpoints.testresults}?health_record=${healthRecordId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResults(res.data);
    } catch (error) {
      console.error("Lỗi khi tải kết quả xét nghiệm:", error);
    }
  };

  useEffect(() => {
    loadTestResults();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Kết quả xét nghiệm của: {patientName}</Text>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <TestResultCard result={item} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadTestResults} />
        }
        ListEmptyComponent={<Text style={styles.empty}>Không có kết quả nào.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: "#f9f9f9" },
  header: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  empty: { textAlign: "center", marginTop: 20, color: "#666" },
});

export default TestResult;
