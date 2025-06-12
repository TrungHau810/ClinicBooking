import { useEffect, useState } from "react";
import { Alert, FlatList, Image, Platform, SafeAreaView, StatusBar, StyleSheet, TouchableOpacity, View } from "react-native";
import { Button, Card, Text, ActivityIndicator, useTheme } from "react-native-paper";
import Apis, { endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Header from "../../components/Header";
import ImageViewing from "react-native-image-viewing";

const PendingDoctor = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);
  const { colors } = useTheme();

  const fetchPendingDoctors = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      const res = await Apis.get(endpoints["pending-doctors"], {
        headers: { Authorization: `Bearer ${token}` },
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
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert("Thành công", res.data.message || "Đã xác minh bác sĩ.");
      fetchPendingDoctors();
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", "Không thể xác minh bác sĩ.");
    }
  };

  useEffect(() => {
    fetchPendingDoctors();
  }, []);

  if (loading) return <ActivityIndicator animating={true} size="large" style={{ marginTop: 20 }} />;

  const renderDoctor = ({ item }) => {
    const { user } = item;

    return (
      <Card style={styles.card} mode="outlined">
        <Card.Content>
          <Text style={styles.title}><Text style={styles.label}>Tên bác sĩ:</Text> {user?.full_name}</Text>
          <Text style={styles.text}><Text style={styles.label}>Bệnh viện: </Text> {item?.hospital_name}</Text>
          <Text style={styles.text}><Text style={styles.label}>Chuyên khoa:</Text> {item?.specialization_name}</Text>
          <Text style={styles.text}><Text style={styles.label}>Tiểu sử:</Text> {item?.biography}</Text>
          <Text style={styles.text}><Text style={styles.label}>Tên đăng nhập:</Text> {user?.username}</Text>
          <Text style={styles.text}><Text style={styles.label}>Email:</Text> {user?.email}</Text>
          <Text style={styles.text}><Text style={styles.label}>SĐT:</Text> {user?.number_phone}</Text>
          <Text style={styles.text}><Text style={styles.label}>Số giấy phép:</Text> {item.license_number || "Chưa cung cấp"}</Text>
        </Card.Content>

        {item.license_image && (
          <TouchableOpacity
            onPress={() => {
              setCurrentImage(item.license_image);
              setVisible(true);
            }}
          >
            <Card.Cover source={{ uri: item.license_image }} style={styles.image} />
          </TouchableOpacity>
        )}

        <Card.Actions style={styles.actions}>
          <Button
            mode="contained"
            onPress={() => approveDoctor(item.id)}
            style={styles.button}
            labelStyle={{ color: "#fff", fontWeight: "bold" }}
          >
            Duyệt bác sĩ
          </Button>
        </Card.Actions>
      </Card>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
      <Header title={"Kiểm duyệt bác sĩ"} />
      <FlatList
        data={doctors}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 10 }}
        renderItem={renderDoctor}
        ListEmptyComponent={<Text style={styles.emptyText}>Không có bác sĩ nào đang chờ duyệt.</Text>}
      />

      {/* Thay Modal bằng ImageViewing */}
      <ImageViewing
        images={currentImage ? [{ uri: currentImage }] : []}
        imageIndex={0}
        visible={visible}
        onRequestClose={() => setVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: '#17A2F3'
  },
  text: {
    fontSize: 15,
    marginBottom: 4,
  },
  label: {
    fontWeight: "bold",
    color: "#444",
  },
  image: {
    marginTop: 8,
    height: 180,
    borderRadius: 20,
    margin: 3
  },
  actions: {
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  button: {
    backgroundColor: "#17A2F3",
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#777",
  },
});
export default PendingDoctor;
