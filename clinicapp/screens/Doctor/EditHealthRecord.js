import { useRoute } from "@react-navigation/native";
import { useRef, useState } from "react";
import { ScrollView } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { RichEditor, RichToolbar } from "react-native-pell-rich-editor";
import { SafeAreaView } from "react-native-safe-area-context";


const EditHealthRecord = () => {

    const { healthrecord } = useRoute().params;
    const [medicalHistory, setMedicalHistory] = useState(healthrecord.medical_history);
    const richText = useRef(medicalHistory);
    console.log(richText);

    return (
        <SafeAreaView>
            <ScrollView style={{ padding: 20 }}>
                <TextInput />
                <Text>Họ tên: {healthrecord.full_name}</Text>
                <Text>Giới tính: {healthrecord.gender}</Text>
                <Text>Ngày sinh: {healthrecord.day_of_birth}</Text>
                <Text>Số điện thoại: {healthrecord.number_phone}</Text>
                <Text>Email: {healthrecord.email}</Text>
                <Text>Địa chỉ: {healthrecord.address}</Text>
                <Text>CCCD: {healthrecord.CCCD}</Text>
                <Text>BHYT: {healthrecord.BHYT}</Text>
                <Text>Nghề nghiệp: {healthrecord.occupation}</Text>
                <Text>Ngày tạo: {healthrecord.created_date}</Text>
                <Text>Ngày cập nhật: {new Date (healthrecord.updated_date).toDateString}</Text>

                <Text style={{ marginTop: 20, fontWeight: 'bold' }}>Tiền sử bệnh:</Text>
                {/* <RichEditor
                    initialContentHTML={medicalHistory}
                    onChange={setMedicalHistory}
                    placeholder="Nhập tiền sử bệnh..."
                    style={{
                        borderWidth: 1,
                        borderColor: '#ccc',
                        minHeight: 200,
                        marginTop: 10
                    }}
                />
                <RichToolbar
                    editor={richText}
                    style={{ backgroundColor: '#eee', marginTop: 10 }}
                /> */}
            </ScrollView>
            <Button mode="contained">Lưu thay đổi</Button>
        </SafeAreaView>
    );
};

export default EditHealthRecord;