import React, { useContext, useEffect, useState } from "react";
import { View, FlatList, StyleSheet, Text, TouchableOpacity, StatusBar, Platform, RefreshControl, } from "react-native";
import { FAB, Icon } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import HealthRecordCard from "../../components/HealthRecordCard";
import { MyUserContext } from "../../configs/MyContexts";

const HealthRecordList = ({ navigation }) => {
  const [records, setRecords] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const user = useContext(MyUserContext);

  const loadRecords = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await authApis(token).get(endpoints["healthrecords"]);
      setRecords(res.data);
    } catch (error) {
      console.error("Lỗi khi tải hồ sơ:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRecords();
    setRefreshing(false);
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate("TestResult", {
          healthRecordId: item.id,
          patientName: item.full_name || "Bệnh nhân",
          record: item,
        })
      }
    >
      <HealthRecordCard record={item} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E90FF" />
      <View style={styles.header}>
        <Icon source="clipboard-text-outline" size={24} color="#fff" />
        <Text style={styles.title}>Hồ sơ sức khỏe</Text>
      </View>

      {user?.type !== "logout" ? (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={
            records.length === 0 ? styles.emptyListContainer : null
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>Không có hồ sơ nào</Text>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      ) : (
        <View style={styles.notLoggedIn}>
          <Text style={styles.emptyText}>⚠️ Vui lòng đăng nhập để xem hồ sơ</Text>
        </View>
      )}

      {user?.type !== "logout" && (
        <FAB
          icon="plus"
          label="Tạo hồ sơ"
          style={styles.fab}
          onPress={() => navigation.navigate("CreateHealthRecord")}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#1E90FF",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 44,
    paddingBottom: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: 'row',
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginLeft: 10
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 16,
    bottom: 16,
    backgroundColor: "#1E90FF",
  },
  notLoggedIn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default HealthRecordList;
