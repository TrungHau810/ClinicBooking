import React, { useEffect, useState } from "react";
import { View, FlatList, Text, StyleSheet, RefreshControl } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { endpoints } from "../../configs/Apis";
import TestResultCard from "../../components/TestResultCard";
import Header from "../../components/Header";
import he from "he";
import { MaterialCommunityIcons } from "@expo/vector-icons"

const TestResult = ({ route }) => {
  const { healthRecordId, patientName, record } = route.params;
  const [results, setResults] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [savedHistory, setSavedHistory] = useState(
    record?.medical_history
      ? he.decode(record.medical_history.replace(/<\/?[^>]+(>|$)/g, ""))
      : ""
  );

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

  const reloadRecord = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await Apis.get(endpoints["healthrecords"],
        {
          headers: { Authorization: `Bearer ${token}` },
        });
    } catch (error) {
      console.error("Lỗi khi tải lại hồ sơ:", error);
    }
  };




  useEffect(() => {
    console.log("Record:", record);
    console.log("Route params:", route.params);
    loadTestResults();
    if (record) reloadRecord();
  }, []);

  return (
    <View style={styles.container}>
      <Header title={"Kết quả xét nghiệm"} />
      <Text style={styles.header}>Kết quả xét nghiệm của: {patientName}</Text>
      <View style={styles.historyContainer}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
          <MaterialCommunityIcons name="clipboard-text" size={20} color="#1E90FF" />
          <Text style={[styles.historyTitle, { marginLeft: 6 }]}>Tiền sử bệnh:</Text>
        </View>
        {savedHistory
          ? savedHistory.split("\n").map((line, index) => (
            <Text key={index} style={styles.historyText}>• {line.trim()}</Text>
          ))
          : <Text style={styles.historyText}>Chưa có dữ liệu</Text>}
      </View>
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
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: "#f9f9f9"
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: 'center',
  },
  empty: {
    textAlign: "center",
    marginTop: 20,
    color: "#666"
  },
  historyContainer: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#1E90FF",
  },
  historyText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
    lineHeight: 20,
  },
});

export default TestResult;
