import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Card } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const getOccupationLabel = (key) => {
  const occupations = {
    doctor: "Bác sĩ",
    nurse: "Y tá",
    teacher: "Giáo viên",
    engineer: "Kỹ sư",
    student: "Học sinh/Sinh viên",
    worker: "Công nhân",
    freelancer: "Làm tự do",
    office_staff: "Nhân viên văn phòng",
    business: "Kinh doanh",
    driver: "Tài xế",
    farmer: "Nông dân",
    police: "Công an",
    other: "Khác",
  };
  return occupations[key] || "Không rõ";
};

const HealthRecordCard = ({ record }) => {
  return (
    <View style={styles.recordBox}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.name}>{record.full_name}</Text>

          <InfoRow icon="card-account-details-outline" label={`Số CCCD: ${record.CCCD}`} />
          <InfoRow icon="shield-check-outline" label={`Số thẻ BHYT: ${record.BHYT}`} />
          <InfoRow icon="gender-male-female" label={`Giới tính: ${record.gender === "male" ? "Nam" : "Nữ"}`} />
          <InfoRow icon="calendar" label={`Ngày sinh: ${new Date(record.day_of_birth).toLocaleDateString("vi-VN")}`} />
          <InfoRow icon="email" label={`Email: ${record.email}`} />
          <InfoRow icon="phone" label={`Điện thoại: ${record.number_phone}`} />
          <InfoRow icon="briefcase" label={`Nghề nghiệp: ${getOccupationLabel(record.occupation)}`} />
        </Card.Content>
      </Card>
    </View>
  );
};

const InfoRow = ({ icon, label }) => (
  <View style={styles.infoRow}>
    <MaterialCommunityIcons name={icon} size={20} color="#A9A9A9" />
    <Text style={styles.infoText}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 6,
    elevation: 2,
    backgroundColor: "#fff",
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#17A2F3",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
  },
  recordBox: {
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 6,
    backgroundColor: "#fff",
    marginBottom: 2,
    marginTop: 8,
    marginHorizontal: 10,
  },
});

export default HealthRecordCard;
