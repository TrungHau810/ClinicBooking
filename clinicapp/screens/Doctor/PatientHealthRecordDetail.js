import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput, Button, Alert, ScrollView, SafeAreaView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { endpoints } from "../../configs/Apis";
import { useNavigation } from "@react-navigation/native";
import TestResultCard from "../../components/TestResultCard";
import he from "he";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Header from "../../components/Header";

const PatientHealthRecordDetail = ({ route }) => {
  const { record } = route.params;
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigation();
  const [history, setHistory] = useState(record.medical_history ? he.decode(record.medical_history.replace(/<\/?[^>]+(>|$)/g, "")) : "");
  const [savedHistory, setSavedHistory] = useState(record.medical_history || "");
  const [saving, setSaving] = useState(false);

  console.log(record);


  const loadTestResults = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await Apis.get(
        `${endpoints["testresults"]}?health_record=${record.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        });
      setTestResults(res.data);
    } catch (err) {
      console.error("Lỗi khi tải kết quả xét nghiệm:", err);
    } finally {
      setLoading(false);
    }
  };

  const reloadRecord = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await Apis.get(
        `${endpoints["healthrecords"]}${record.id}/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        });
      const newMedicalHistory = res.data.medical_history || "";
      setSavedHistory(
        he.decode(newMedicalHistory.replace(/<\/?[^>]+(>|$)/g, ""))
      );
    } catch (error) {
      console.error("Lỗi khi tải lại hồ sơ:", error);
    }
  };

  const updateMedicalHistory = async () => {
    try {
      setSaving(true);
      const token = await AsyncStorage.getItem("token");
      const htmlHistory = `<p>${history}</p>`;
      await Apis.patch(
        `${endpoints["healthrecords-update"]}${record.id}/`,
        { medical_history: htmlHistory },
        {
          headers: { Authorization: `Bearer ${token}` },
        });

      await reloadRecord(); // Đồng bộ lại từ server
      Alert.alert("Thông báo", "Cập nhật thành công");
    } catch (err) {
      console.error("Lỗi khi cập nhật tiền sử bệnh:", err);
      Alert.alert("Lỗi", "Lỗi khi cập nhật");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadTestResults();
  }, []);


  const renderHeader = () => (
    <View>
      <Text style={styles.title}>
        <MaterialCommunityIcons name="file-document-outline" size={25} color="#1E90FF" /> Hồ sơ của: {record.full_name}
      </Text>

      <Text style={styles.subtitle}>
        <MaterialCommunityIcons name="history" size={22} color="#1E90FF" /> Tiền sử bệnh đã lưu
      </Text>
      <View style={styles.historyBox}>
        <Text style={styles.historyText}>
          {savedHistory?.trim() !== "" ? savedHistory : "Chưa có thông tin"}
        </Text>
      </View>

      <Text style={styles.subtitle}>
        <MaterialCommunityIcons name="pencil-outline" size={22} color="#1E90FF" /> Chỉnh sửa tiền sử bệnh lý
      </Text>

      <TextInput
        onChangeText={setHistory}
        placeholder="Nhập tiền sử bệnh..."
        multiline
        numberOfLines={4}
        value={history}
        style={styles.input}
      />
      <View style={styles.buttonContainer}>
        <Button
          title={saving ? "Đang lưu..." : "Lưu tiền sử bệnh"}
          onPress={updateMedicalHistory}
          color="#1E90FF"
          disabled={saving}
        />
      </View>

      <Text style={styles.subtitle}>
        <MaterialCommunityIcons name="clipboard-text-outline" size={22} color="#1E90FF" /> Kết quả xét nghiệm
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title={"Hồ sơ bệnh án"} />
      {loading ? (
        <ActivityIndicator size="large" color="#1E90FF" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={testResults}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <TestResultCard result={item} />}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <Text style={styles.empty}>Không có kết quả xét nghiệm nào</Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginHorizontal: 5,
    justifyContent: 'center',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#f9f9f9",
    marginBottom: 10,
    textAlignVertical: "top",
  },
  empty: {
    textAlign: "center",
    color: "#777",
    marginTop: 20,
  },
  historyBox: {
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f3f3f3",
    borderRadius: 8,
    padding: 10,
    minHeight: 80,
  },
  historyText: {
    fontSize: 16,
    color: "#333",
  },
  buttonContainer: {
    borderRadius: 20,
    overflow: 'hidden', // cần để borderRadius có hiệu lực
    elevation: 2, // tạo hiệu ứng đổ bóng nếu cần
  },
});

export default PatientHealthRecordDetail;
