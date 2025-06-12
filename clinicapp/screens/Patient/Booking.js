import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/Header";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Button, Card, List, Modal, Portal, Text, TextInput } from "react-native-paper";
import { useEffect, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";

const Booking = () => {
    const nav = useNavigation();
    const { doctor } = useRoute().params;

    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [schedules, setSchedules] = useState([]);
    const [selectedTime, setSelectedTime] = useState(new Date());
    const [selectedScheduleId, setSelectedScheduleId] = useState(null);
    const [healthrecords, setHealrecords] = useState([]);
    const [visibleModal, setVisibleModal] = useState(false);
    const [selectedRecordId, setSelectedRecordId] = useState(null);
    const [token, setToken] = useState("");
    const [selectedDisease, setSelectedDisease] = useState(null);
    const [symptoms, setSymptoms] = useState("");
    const [appointmentId, setAppointmentId] = useState("");

    const diseaseType = [
        { key: 'HoHap', label: 'Đường hô hấp' },
        { key: 'TieuHoa', label: 'Đường tiêu hoá' },
        { key: 'TK_TT', label: 'Thần kinh - Tâm thần' },
        { key: 'Mat', label: 'Bệnh về Mắt' },
        { key: 'ChanThuong', label: 'Chấn thương - chỉnh hình' },
        { key: 'DaLieu', label: 'Da liễu' },
        { key: 'TaiMuiHong', label: 'Tai - Mũi - Họng' },
        { key: 'Khac', label: 'Khác' },
    ];

    const formatDate = (date) => {
        let d = date.getDate().toString().padStart(2, '0');
        let m = (date.getMonth() + 1).toString().padStart(2, '0');
        let y = date.getFullYear();
        return `${y}-${m}-${d}`;
    };

    const loadSchedule = async () => {
        const date = formatDate(selectedDate);
        let url = `${endpoints['schedules']}?date=${date}&doctor_id=${doctor.user.id}`;
        let res = await Apis.get(url);
        setSchedules(res.data);
    };

    const loadHealthRecord = async () => {
        try {
            let token = await AsyncStorage.getItem('token');
            setToken(token);
            let res = await authApis(token).get(endpoints['healthrecords']);
            setHealrecords(res.data);
        } catch (error) {
            console.log(error);
        }
    };

    const onChangeDate = (event, date) => {
        if (date) setSelectedDate(date);
        setShowDatePicker(false);
    };

    const booking = async () => {
        try {
            setLoading(true);
            let res = await authApis(token).post(endpoints['appointments'], {
                "healthrecord_id": selectedRecordId,
                "disease_type": selectedDisease,
                "symptoms": symptoms,
                'schedule_id': selectedScheduleId
            });
            setAppointmentId(res.data.id);
            Alert.alert("Thông báo", "Đặt lịch khám thành công!", [{
                text: "Ok",
                onPress: () => nav.navigate("Payment", { appointmentId: res.data.id }),
            }]);
        } catch (error) {
            let err = error.response?.data?.non_field_errors?.[0] || "Lỗi đặt lịch!";
            Alert.alert("Thông báo", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSchedule();
    }, [selectedDate]);

    useEffect(() => {
        loadHealthRecord();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <Header title={"Đặt lịch khám"} />

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <List.Item
                        title={`Bác sĩ ${doctor.doctor}`}
                        description={doctor.biography}
                        left={() => <List.Icon icon="doctor" />}
                    />
                    <List.Item
                        title={doctor.hospital_name}
                        left={() => <List.Icon icon="hospital-building" />}
                    />
                    <List.Item
                        title={`Chuyên khoa: ${doctor.specialization_name}`}
                        left={() => <List.Icon icon="hospital" />}
                    />
                    <List.Item
                        title={`Phí khám bệnh: ${doctor.consultation_fee}`}
                        left={() => <List.Icon icon="cash" />}
                    />
                </View>

                <View style={styles.section}>
                    <TouchableOpacity
                        onPress={() => setShowDatePicker(true)}
                        style={styles.datePickerButton}
                        activeOpacity={0.7}
                    >
                        <List.Item
                            title="Chọn ngày khám"
                            description={selectedDate.toLocaleDateString("vi-VN")}
                            left={() => <List.Icon icon="calendar" color="#2e86de" />}
                            right={() => <List.Icon icon="chevron-down" />}
                            titleStyle={{ fontWeight: 'bold' }}
                            descriptionStyle={{ color: '#555' }}
                        />
                    </TouchableOpacity>

                    {showDatePicker && (
                        <DateTimePicker
                            value={selectedDate}
                            mode="date"
                            display={Platform.OS === "ios" ? "inline" : "default"}
                            onChange={onChangeDate}
                            minimumDate={new Date()}
                        />
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Chọn giờ:</Text>
                    {schedules.length === 0 ? (
                        <Text>Không có lịch phù hợp</Text>
                    ) : (
                        schedules.map((item, index) => {
                            const start = item.start_time.slice(0, 5);
                            const end = item.end_time.slice(0, 5);
                            const label = `${start} - ${end}`;
                            const isSelected =
                                selectedTime.getHours() === parseInt(item.start_time.slice(0, 2)) &&
                                selectedTime.getMinutes() === parseInt(item.start_time.slice(3, 5));

                            return (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => {
                                        const [hour, minute] = item.start_time.split(":");
                                        const time = new Date(selectedDate);
                                        time.setHours(parseInt(hour), parseInt(minute));
                                        setSelectedTime(time);
                                        setSelectedScheduleId(item.id);
                                    }}
                                    style={[
                                        styles.timeSlot,
                                        isSelected && styles.selectedTimeSlot,
                                    ]}
                                >
                                    <Text style={[
                                        styles.timeSlotText,
                                        isSelected && styles.selectedTimeSlotText,
                                    ]}>
                                        {label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Chọn hồ sơ sức khoẻ</Text>
                    <Button mode="outlined" onPress={() => setVisibleModal(true)}>
                        {selectedRecordId ? `Đã chọn hồ sơ #${selectedRecordId}` : "Chọn hồ sơ"}
                    </Button>
                </View>

                <Portal>
                    <Modal
                        visible={visibleModal}
                        onDismiss={() => setVisibleModal(false)}
                        contentContainerStyle={styles.modalContainer}
                    >
                        <Text style={styles.label}>Chọn hồ sơ sức khoẻ</Text>
                        {healthrecords.map((record) => (
                            <TouchableOpacity
                                key={record.id}
                                onPress={() => setSelectedRecordId(record.id.toString())}
                            >
                                <Card style={[
                                    styles.healthCard,
                                    selectedRecordId == record.id.toString() && styles.selectedHealthCard
                                ]}>
                                    <Card.Content>
                                        <Text style={{ fontWeight: "bold" }}>{record.full_name}</Text>
                                        <Text>SĐT: {record.number_phone}</Text>
                                        <Text>Ngày sinh: {new Date(record.day_of_birth).toLocaleDateString()}</Text>
                                        <Text>Địa chỉ: {record.address}</Text>
                                    </Card.Content>
                                </Card>
                            </TouchableOpacity>
                        ))}

                        <Button
                            mode="contained"
                            onPress={() => setVisibleModal(false)}
                            style={styles.confirmButton}
                            disabled={!selectedRecordId}
                        >
                            Xác nhận
                        </Button>
                    </Modal>
                </Portal>

                <View style={styles.section}>
                    <Text style={styles.label}>Chọn loại bệnh</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={selectedDisease}
                            onValueChange={(itemValue) => setSelectedDisease(itemValue)}
                        >
                            <Picker.Item label="-- Chọn loại bệnh --" value={null} />
                            {diseaseType.map((item) => (
                                <Picker.Item key={item.key} label={item.label} value={item.key} />
                            ))}
                        </Picker>
                    </View>

                    <Text style={styles.label}>Triệu chứng (Nếu có)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Nhập triệu chứng... (Nếu có)"
                        mode="outlined"
                        multiline
                        numberOfLines={4}
                        onChangeText={setSymptoms}
                    />
                </View>

                <Button
                    style={styles.bookingButton}
                    loading={loading}
                    disabled={loading}
                    mode="contained"
                    onPress={booking}
                >
                    Đặt lịch
                </Button>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Booking;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: "#fff",
    },
    section: {
        marginBottom: 20,
    },
    label: {
        fontWeight: "bold",
        fontSize: 16,
        marginBottom: 8,
    },
    timeSlot: {
        padding: 12,
        borderRadius: 10,
        marginBottom: 8,
        backgroundColor: "#ecf0f1",
    },
    selectedTimeSlot: {
        backgroundColor: "#2e86de",
    },
    timeSlotText: {
        textAlign: "center",
        color: "#000",
    },
    selectedTimeSlotText: {
        color: "#fff",
    },
    modalContainer: {
        backgroundColor: "white",
        padding: 20,
        margin: 20,
        borderRadius: 10,
    },
    healthCard: {
        marginBottom: 10,
        backgroundColor: "white",
    },
    selectedHealthCard: {
        backgroundColor: "#d0ebff",
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 10,
        marginBottom: 12,
        backgroundColor: "#f5f6fa",
        overflow: "hidden",
        paddingHorizontal: 4,
    },
    input: {
        backgroundColor: "#f5f6fa",
        fontSize: 16,
        borderRadius: 10,
        paddingVertical: 12,
        marginTop: 8,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    confirmButton: {
        marginTop: 16,
        borderRadius: 10,
    },
    bookingButton: {
        borderRadius: 60,
        paddingVertical: 5,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    datePickerButton: {
        borderRadius: 8,
        backgroundColor: "#f8f9fa",
        paddingVertical: 4,
    },
});
