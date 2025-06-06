import { useEffect, useState } from "react";
import { Alert, FlatList, Image, StyleSheet, View } from "react-native";
import { Button, Card, Text, ActivityIndicator } from "react-native-paper";
import Apis, { endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PendingDoctor = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingDoctors = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      const res = await Apis.get(endpoints["pending-doctors"], {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDoctors(res.data);
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", "Không thể tải danh sách bác sĩ.");
    } finally {
      setLoading(false);
    }
  };

  const approveDoctor = async (doctorId) => {
    try {
      const token = await AsyncStorage.getItem("token");

      const res = await Apis.post(endpoints["approve-doctor"](doctorId), null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      Alert.alert("Thành công", res.data.message || "Đã xác minh bác sĩ.");
      fetchPendingDoctors(); // refresh danh sách
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", "Không thể xác minh bác sĩ.");
    }
  };

  useEffect(() => {
    fetchPendingDoctors();
  }, []);

  if (loading) return <ActivityIndicator animating={true} size="large" style={{ marginTop: 20 }} />;

  return (
    <FlatList
      data={doctors}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={{ padding: 10 }}
      renderItem={({ item }) => (
        <Card style={styles.card}>
          <Card.Title title={item.user?.username || "Không rõ"} subtitle={item.user?.email} />
          {item.license_image && (
            <Card.Cover source={{ uri: item.license_image }} style={styles.image} />
          )}
          <Card.Content>
            <Text>Số giấy phép: {item.license_number}</Text>
          </Card.Content>
          <Card.Actions>
            <Button onPress={() => approveDoctor(item.id)}>Duyệt</Button>
          </Card.Actions>
        </Card>
      )}
      ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 20 }}>Không có bác sĩ nào đang chờ duyệt.</Text>}
    />
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 8,
  },
  image: {
    marginTop: 8,
    height: 180,
  },
});

export default PendingDoctor;
