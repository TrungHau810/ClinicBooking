import React, { useEffect, useState } from "react";
import { View, Alert, TouchableOpacity } from "react-native";
import { Text, Card, Button, TextInput } from "react-native-paper";
import { Modal } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import Header from "../../components/Header"
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import AppointmentDetailStyle from "../../styles/AppointmentDetailStyle";

const AppointmentDetails = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const appointment = route?.params?.appointment;
    const doctor = route?.params?.doctor;
    const diseaseTypeMap = route?.params?.diseaseList;
    const statusList = route?.params?.statusList;
    const [cancelReason, setCancelReason] = useState("");
    const [loading, setLoading] = useState(false);
    const [cancelModalVisible, setCancelModalVisible] = useState(false);
    const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState(new Date());

    const [schedules, setSchedules] = useState([]);
    const [selectedScheduleId, setSelectedScheduleId] = useState(null);



    const getStatusLabel = (statusValue) => {
        const statusObj = statusList.find(s => s.value === statusValue);
        return statusObj ? statusObj.label : statusValue;
    };


    const cancel = async () => {
        if (!cancelReason.trim()) {
            Alert.alert("Thông báo", "Vui lòng nhập lý do huỷ");
            return;
        }

        try {
            const confirm = await new Promise((resolve) => {
                Alert.alert("Xác nhận", "Bạn có chắc chắn muốn huỷ lịch hẹn này?", [
                    { text: "Huỷ", style: "cancel", onPress: () => resolve(false) },
                    { text: "Đồng ý", onPress: () => resolve(true) },
                ]);
            });

            if (!confirm) return;

            setLoading(true);

            let token;
            try {
                token = await AsyncStorage.getItem("token");
                if (!token) throw new Error("Không tìm thấy token xác thực.");
            } catch (tokenErr) {
                console.error("Lỗi lấy token:", tokenErr);
                Alert.alert("Lỗi", "Không thể xác thực người dùng.");
                return;
            }

            try {
                await authApis(token).patch(
                    `${endpoints["appointments"]}${appointment.id}/cancel/`,
                    { reason: cancelReason }
                );

                Alert.alert("Huỷ thành công");
                setCancelReason("");
                navigation.navigate("Appointment", { refresh: true });
            } catch (apiError) {
                console.error("Lỗi API huỷ lịch:", apiError);
                let message = "Vui lòng thử lại sau.";

                if (apiError.response) {
                    message =
                        apiError.response.data?.detail ||
                        apiError.response.data?.error ||
                        JSON.stringify(apiError.response.data);
                    console.log(message);
                }
                Alert.alert("Không thể huỷ lịch", message);
            }
        } catch (err) {
            console.error("Lỗi tổng quát khi huỷ:", err);
            Alert.alert("Lỗi", "Có lỗi xảy ra. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    // Lấy lịch biểu các bác sĩ theo ngày
    const loadScheduleToReSchedule = async () => {
        // Lấy ngày đã chọn
        const date = selectedDate.toISOString().split("T")[0];  // Format date: YYYY-MM-DD
        // Gọi API để lấy 
        let url = `${endpoints['schedules']}?date=${date}&doctor_id=${doctor.user.id}`;
        let res = await Apis.get(url);
        setSchedules(res.data);

    };


    const reschedule = async () => {
        console.log("Đổi lịch");
        console.log(selectedScheduleId);


        try {
            if (selectedScheduleId === null) {
                Alert.alert("Thông báo", "Bạn chưa chọn giờ khám ");
            } else {
                setLoading(true);
                const token = await AsyncStorage.getItem("token");
                if (!token) throw new Error("Thiếu token");

                let res = await authApis(token).patch(`${endpoints['appointments']}${appointment.id}/reschedule/`,
                    {
                        new_schedule_id: selectedScheduleId
                    }
                );

                console.log('-----', res.data);

                Alert.alert("Thành công", "Lịch hẹn đã được đổi.");
                setRescheduleModalVisible(false);
                navigation.navigate("Appointment", { refresh: true });
            }
        } catch (err) {
            console.log(err.response.data);
            Alert.alert("Không thể đổi lịch", err.response.data.error);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        if (rescheduleModalVisible && selectedDate) {
            console.log(rescheduleModalVisible, selectedDate);
            loadScheduleToReSchedule();
            console.log(schedules);
        }
    }, [selectedDate]);


    return (
        <View style={AppointmentDetailStyle.container}>
            <Header title={"Chi tiết lịch khám"} />
            <Card>
                <Card.Content>
                    <Text variant="titleLarge">Lịch khám BS {doctor.user.full_name}</Text>
                    <Text>Bác sĩ: {doctor.user.full_name}</Text>
                    <Text>Bệnh viện: {doctor.hospital_name}</Text>
                    <Text>Bác sĩ: {doctor.specialization_name}</Text>
                    <Text>Bệnh lý: {diseaseTypeMap[appointment.disease_type] || appointment.disease_type}</Text>
                    <Text>
                        Ngày: {new Date(appointment.schedule.date).toLocaleDateString()}
                    </Text>
                    <Text>
                        Giờ: {appointment.schedule.start_time.slice(0, 5)} -{" "}
                        {appointment.schedule.end_time.slice(0, 5)}
                    </Text>
                    <Text>Trạng thái: {getStatusLabel(appointment.status)}</Text>
                    {appointment.cancel_reason && (
                        <Text style={AppointmentDetailStyle.cancelText}>Lý do huỷ: {appointment.cancel_reason}</Text>
                    )}
                </Card.Content>
            </Card>
            {appointment.status !== "cancelled" && appointment.status !== "completed" && (
                <View>

                    <Button
                        style={AppointmentDetailStyle.cancelBtn}
                        onPress={() => {
                            setCancelModalVisible(true);
                            setRescheduleModalVisible(false);
                        }}
                    >
                        <Text style={{ color: "white" }}>Huỷ lịch hẹn</Text>
                    </Button>

                    <Button
                        style={AppointmentDetailStyle.Rebtn}
                        onPress={() => {
                            setCancelModalVisible(false);
                            setRescheduleModalVisible(true);
                        }}
                    >
                        <Text style={{ color: "white" }}>Đổi lịch hẹn</Text>
                    </Button>

                </View>
            )}

            {/* Modal hiển thị thông tin để huỷ lịch hẹn */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={cancelModalVisible}
                onRequestClose={() => setCancelModalVisible(false)}
            >
                <View style={AppointmentDetailStyle.modalOverlay}>
                    <View style={AppointmentDetailStyle.modalContent}>
                        <Text style={AppointmentDetailStyle.modalTitle}>Nhập lý do huỷ</Text>
                        <TextInput
                            mode="outlined"
                            placeholder="Nhập lý do..."
                            value={cancelReason}
                            onChangeText={setCancelReason}
                            multiline
                            style={AppointmentDetailStyle.modalInput}
                        />
                        <View style={AppointmentDetailStyle.modalButtons}>
                            <Button onPress={() => setCancelModalVisible(false)}>Đóng</Button>
                            <Button
                                mode="contained"
                                loading={loading}
                                disabled={loading}
                                onPress={cancel}
                            >
                                Xác nhận huỷ
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal hiển thị thông tin để đổi lịch */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={rescheduleModalVisible}
                onRequestClose={() => setRescheduleModalVisible(false)}
            >
                <View style={AppointmentDetailStyle.modalOverlay}>
                    <View style={AppointmentDetailStyle.modalContent}>
                        <Text style={AppointmentDetailStyle.modalTitle}>Đổi lịch hẹn</Text>
                        <Text>*Chọn lịch khám ngày khác của Bác sĩ {doctor.user.full_name}</Text>
                        {/* Nút chọn ngày */}
                        <TouchableOpacity
                            onPress={() => setDatePickerVisible(true)}
                            style={AppointmentDetailStyle.datePickerButton}
                        >
                            <Text>Chọn ngày: {selectedDate.toLocaleDateString()}</Text>
                        </TouchableOpacity>

                        {/* Hiển thị chọn ngày tháng năm */}
                        {datePickerVisible && (
                            <DateTimePicker
                                value={selectedDate}
                                mode="date"
                                display="default"
                                onChange={(event, date) => {
                                    setDatePickerVisible(Platform.OS === 'ios'); // iOS giữ picker luôn mở
                                    if (date) {
                                        setSelectedDate(date);
                                    }
                                }}
                            />
                        )}

                        <View style={{ marginBottom: 12 }}>
                            <Text style={{ fontWeight: "bold", marginBottom: 8 }}>Chọn giờ:</Text>

                            {schedules.length === 0 ? (
                                <Text>Không có lịch phù hợp</Text>
                            ) : (
                                schedules.map((item, index) => {
                                    // Format giờ HH:MM - HH:MM
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
                                                AppointmentDetailStyle.timeOption,
                                                isSelected
                                                    ? AppointmentDetailStyle.timeOptionSelected
                                                    : AppointmentDetailStyle.timeOptionUnselected,
                                            ]}
                                        >
                                            <Text style={
                                                isSelected
                                                    ? AppointmentDetailStyle.timeOptionTextSelected
                                                    : AppointmentDetailStyle.timeOptionTextUnselected
                                            }> {label}</Text>
                                        </TouchableOpacity>
                                    );
                                })
                            )}
                        </View>



                        <View style={AppointmentDetailStyle.modalButtons}>
                            <Button onPress={() => setRescheduleModalVisible(false)}>Đóng</Button>
                            <Button
                                mode="contained"
                                onPress={reschedule}
                                loading={loading}
                                disabled={loading}
                            >
                                Xác nhận đổi
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>



        </View>
    );
};

export default AppointmentDetails;