import React, { useContext, useEffect, useState } from "react";
import { View, FlatList, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { endpoints } from "../../configs/Apis";
import HealthRecordCard from "../../components/HealthRecordCard";
import { Icon } from "react-native-paper";
import { MyUserContext } from "../../configs/MyContexts";

const PatientHealthRecords = ({ navigation }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = useContext(MyUserContext);

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

  if (user?.type === "logout") {
    return (
      <View style={styles.notLoggedIn}>
        <Text style={styles.empty}>⚠️ Vui lòng đăng nhập để xem hồ sơ</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Icon source="folder-account-outline" size={30} color="#1E90FF" style={styles.titleIcon} />
        <Text style={styles.title}> Hồ sơ bệnh nhân đã đặt lịch</Text>
      </View>
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
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
    marginTop: 30
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  empty: {
    textAlign: "center",
    color: "#999",
    marginTop: 20,
    fontSize: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  titleIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  notLoggedIn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default PatientHealthRecords;
