
import React, { useEffect, useState } from "react";
import { View, FlatList, StyleSheet, Text, TouchableOpacity, StatusBar, Platform } from "react-native";
import { Button, Card } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { endpoints } from "../../configs/Apis";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MyStyles from "../../styles/MyStyles";
import HealthRecordCard from "../../components/HealthRecordCard";

const HealthRecordList = ({ navigation }) => {
  const [records, setRecords] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRecords();  // gọi lại hàm load
    setRefreshing(false);
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const getOccupationLabel = (key) => {
    const occupations = {
      doctor: 'Bác sĩ',
      nurse: 'Y tá',
      teacher: 'Giáo viên',
      engineer: 'Kỹ sư',
      student: 'Học sinh/Sinh viên',
      worker: 'Công nhân',
      freelancer: 'Làm tự do',
      office_staff: 'Nhân viên văn phòng',
      business: 'Kinh doanh',
      driver: 'Tài xế',
      farmer: 'Nông dân',
      police: 'Công an',
      other: 'Khác'
    };

    return occupations[key] || 'Không rõ';
  };

  const renderItem = ({ item }) => <HealthRecordCard record={item} />;

  return (
    <View style={styles.container}>
      <View style={styles.headerWrapper}>
        <StatusBar barStyle="light-content" backgroundColor="#1E90FF" />
        <View style={MyStyles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.navigate("createHealthRecord")} style={MyStyles.rightIcon}>
            <MaterialCommunityIcons name="account-plus" size={25} color="#fff" />
            <Text style={styles.createText}>Tạo mới</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Danh sách hồ sơ</Text>
        </View>
      </View>
      <FlatList
        data={records}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // padding: 1,
    backgroundColor: "#fff",
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#fff",
  },
  card: {
    marginBottom: 1,
    borderRadius: 6,
    elevation: 2,
    backgroundColor: '#fff',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#17A2F3',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  recordBox: {
    borderWidth: 1,
    borderColor: '#000', // viền đen
    borderRadius: 6,     // bo góc nhẹ
    // padding: 1,
    // margin: 10,
    backgroundColor: '#fff',
    marginBottom: 2,
    marginTop: 8,
    marginHorizontal: 10
  },
  headerWrapper: {
    backgroundColor: '#1E90FF', // xanh dương
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 44, // tránh đè status bar (44 cho iPhone notch)
    paddingBottom: 10,
    width: '100%',
  },
  createText: {
    color: '#fff',
  },
});

export default HealthRecordList;
