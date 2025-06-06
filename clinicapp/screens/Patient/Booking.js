import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/Header";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Button, Card, List, Modal, Portal, RadioButton, Text, TextInput } from "react-native-paper";
import { useEffect, useState } from "react";
import { Alert, Platform, TouchableOpacity, View } from "react-native";
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
        let m = (date.getMonth() + 1).toString().padStart(2, '0');  // tháng từ 0
        let y = date.getFullYear();
        return `${y}-${m}-${d}`;
    };


    const loadSchedule = async () => {
        // Lấy ngày đã chọn
        const date = formatDate(selectedDate);   // Format date: YYYY-MM-DD
        // Gọi API để lấy 
        let url = `${endpoints['schedules']}?date=${date}&doctor_id=${doctor.user.id}`;
        let res = await Apis.get(url);
        console.log("-------------", url);
        console.log(res.data);
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

    // Set ngày đã chọn
    const onChangeDate = (event, date) => {
        if (date) {
            setSelectedDate(date);
        }
        setShowDatePicker(false);
    };

    // Dùng để đặt lịch
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
            console.log("------", typeof(res.data.id), res.data.id);

            // Hiển thị alert thông báo đặt lịch thành công và chuyển đến trang thanh toán
            Alert.alert("Thông báo", "Đặt lịch khám thành công!", [{
                text: "Ok",
                onPress: () => nav.navigate("Payment", { appointmentId: res.data.id }),
            }
            ]);

        } catch (error) {
            let err = error.response.data.non_field_errors[0];
            Alert.alert("Thông báo", err);
            console.log(err);
        } finally {
            setLoading(false);
        }
    };


    // Gọi API mỗi khi selectedDate thay đổi
    useEffect(() => {
        loadSchedule();
    }, [selectedDate]);

    useEffect(() => {
        loadHealthRecord();
    }, []);

    return (
        <SafeAreaView>
            <Header title={"Đặt lịch khám"} />
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

            <List.Item
                title="Chọn ngày khám"
                description={selectedDate.toLocaleDateString("vi-VN")}
                left={() => <List.Icon icon="calendar" />}
                onPress={() => setShowDatePicker(true)}
            />

            {showDatePicker && (
                <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "inline" : "default"}
                    onChange={onChangeDate}
                    minimumDate={new Date()}
                />
            )}


            {/* Danh sách khung giờ */}
            <View style={{ marginBottom: 12, paddingHorizontal: 16 }}>
                <Text style={{ fontWeight: "bold", marginBottom: 8 }}>Chọn giờ:</Text>

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
                                style={{
                                    padding: 12,
                                    borderRadius: 6,
                                    marginBottom: 8,
                                    backgroundColor: isSelected ? "#2e86de" : "#ecf0f1",
                                }}
                            >
                                <Text style={{ color: isSelected ? "#fff" : "#000", textAlign: "center" }}>
                                    {label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })
                )}
            </View>

            <View>
                <Text>Chọn hồ sơ sức khoẻ</Text>
                <Button mode="outlined" onPress={() => setVisibleModal(true)}>
                    {selectedRecordId ? `Đã chọn hồ sơ #${selectedRecordId}` : "Chọn hồ sơ"}
                </Button>
            </View>

            <Portal>
                <Modal
                    visible={visibleModal}
                    onDismiss={() => setVisibleModal(false)}
                    contentContainerStyle={{
                        backgroundColor: "white",
                        padding: 20,
                        margin: 20,
                        borderRadius: 8,
                    }}
                >
                    <Text style={{ fontWeight: "bold", marginBottom: 12 }}>
                        Chọn hồ sơ sức khoẻ
                    </Text>


                    {healthrecords.map((record) => (
                        <TouchableOpacity
                            key={record.id}
                            onPress={() => setSelectedRecordId(record.id.toString())}
                        >
                            <Card style={{ marginBottom: 10, backgroundColor: selectedRecordId == record.id.toString() ? "#d0ebff" : "white" }}>
                                <Card.Content>
                                    <Text style={{ fontWeight: "bold" }}>{record.full_name}</Text>
                                    <Text>SĐT: {record.number_phone}</Text>
                                    <Text>Ngày sinh: {record.day_of_birth}</Text>
                                    <Text>Địa chỉ: {record.address}</Text>
                                </Card.Content>
                            </Card>
                        </TouchableOpacity>
                    ))}

                    <Button
                        mode="contained"
                        onPress={() => setVisibleModal(false)}
                        style={{ marginTop: 16 }}
                        disabled={!selectedRecordId}
                    >
                        Xác nhận
                    </Button>
                </Modal>
            </Portal>

            <View>
                <Text>Chọn loại bệnh</Text>
                <View  >
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
                <Text>Triệu chứng (Nếu có)</Text>
                <TextInput placeholder="Nhập triệu chứng... (Nếu có)" onChangeText={setSymptoms} />
            </View>

            <Button loading={loading} disabled={loading}
                mode="contained" onPress={booking}
            >
                Đặt lịch
            </Button>
        </SafeAreaView>
    );
}

export default Booking;