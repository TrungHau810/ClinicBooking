// import { useState } from "react";
// import { ScrollView, View } from "react-native";
// import { Button, RadioButton, Text, TextInput } from "react-native-paper";
// import { SafeAreaView } from "react-native-safe-area-context";


// const HealthRecord = () => {

//     const healthFields =[{
//         label:"Họ tên (có dấu)",
//     },{
//         label:"Ngày sinh",
//     },{
//         label:"Giới tính",
//     },{
//         label:"Mã bảo hiểm y tế",
//     },{
//         label:"Số CCCD",
//     },{
//         label:"Email (Dùng để nhận phiếu khám bệnh)",
//     },{
//         label:"Số điện thoại",
//     },{
//         label:"Địa chỉ (Số nhà/Tên đường/Ấp thôn xóm)",
//     },]


//     const renderForm =(healthField)=>{
//         return(
//             healthField.map(field=><TextInput key={field.label} label={field.label}></TextInput>)
//         );
//     };

//     return (
//         <SafeAreaView>
//             <Text>Hồ sơ bệnh nhân</Text>
//             <Button mode="contained">Tạo mới</Button>

//             <ScrollView>
//                 <Text>Thông tin chung</Text>

//                 {renderForm(healthFields)}
//                 {/* <TextInput label={'Họ tên (có dấu)'} mode="outlined"></TextInput>
//                 <TextInput label={'Ngày sinh'} mode="outlined"></TextInput>
//                 <TextInput label={'họ tên'} mode="outlined"></TextInput> */}
//             </ScrollView>
//         </SafeAreaView>
//     );
// }

// export default HealthRecord;


import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Button, RadioButton, Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CreateHealthRecord = ({ navigation }) => {
  const [gender, setGender] = useState("male");
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(false);

  const setState = (value, field) => {
    setUser({ ...user, [field]: value });
  };

  const createHealthRecord = async () => {
    setLoading(true);
    let token = await AsyncStorage.getItem('token');

    let form = new FormData();
    form.append('active', true);
    for (let key in user) {
      form.append(key, user[key]);
    }
    try {
      let res = await Apis.post(endpoints['healthrecords'], form, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.status === 201) {
        Alert.alert("Thành công", "Tạo hồ sơ thành công!", [
          {
            text: "OK",
            onPress: () => {
              navigation.navigate("tabs", { screen: "healthrecordList" }); // hoặc "createHealthRecord" nếu đúng tên
            }
          }
        ],
          { cancelable: false }
        );
      }

    } catch (error) {
      console.error(error);
      const data = error?.response?.data;

      // Hiển thị lỗi chi tiết nếu BHYT hoặc CCCD trùng
      if (data?.BHYT || data?.CCCD) {
        const messages = [];
        if (data.BHYT) messages.push(`Mã BHYT đã bị trùng`);
        if (data.CCCD) messages.push(`CCCD đã bị trùng`);
        messages.push('Vui lòng kiểm tra lại!')

        Alert.alert("Lỗi dữ liệu", messages.join("\n"));
      } else {
        Alert.alert("Lỗi", data?.detail || "Đã có lỗi xảy ra.");
      }
    } finally {
      setLoading(false); // Kết thúc loading
    }
  };

  const occupation = [
    { value: 'doctor', label: 'Bác sĩ' },
    { value: 'nurse', label: 'Y tá' },
    { value: 'teacher', label: 'Giáo viên' },
    { value: 'engineer', label: 'Kỹ sư' },
    { value: 'student', label: 'Học sinh/Sinh viên' },
    { value: 'worker', label: 'Công nhân' },
    { value: 'freelancer', label: 'Làm tự do' },
    { value: 'office_staff', label: 'Nhân viên văn phòng' },
    { value: 'business', label: 'Kinh doanh' },
    { value: 'driver', label: 'Tài xế' },
    { value: 'farmer', label: 'Nông dân' },
    { value: 'police', label: 'Công an' },
    { value: 'other', label: 'Khác' },
  ];

  const healthFields = [
    { label: "Họ tên (có dấu)", field: "full_name" },
    { label: "Ngày sinh", field: "day_of_birth" },
    { label: "Mã bảo hiểm y tế", field: "BHYT" },
    { label: "Số CCCD", field: "CCCD" },
    { label: "Email (Dùng để nhận phiếu khám bệnh)", field: "email" },
    { label: "Số điện thoại", field: "number_phone" },
    { label: "Địa chỉ (Số nhà/Tên đường/Ấp thôn xóm)", field: "address" },
    { label: "Tiền sử bệnh án", field: "medical_history" },

  ];

  const renderOccupation = () => {
    return (
      <View>
        <Text style={styles.label}>Nghề nghiệp</Text>
        <RadioButton.Group
          onValueChange={(value) => setState(value, "occupation")}
          value={user.occupation}
        >
          <View>
            {occupation.map((item) => (
              <RadioButton.Item
                key={item.value}
                label={item.label}
                value={item.value}
              />
            ))}
          </View>
        </RadioButton.Group>
      </View>
    );
  };


  const renderForm = (fields) =>
    fields.map((field) => (
      <TextInput
        key={field.field}
        label={field.label}
        mode="outlined"
        style={styles.input}
        onChangeText={t => setState(t, field.field)}
      />
    ));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.sectionTitle}>Thông tin chung</Text>

        {renderForm(healthFields.slice(0, 1))}

        <Text style={styles.label}>Giới tính</Text>
        <RadioButton.Group
          onValueChange={(value) => setState(value, "gender")}
          value={user.gender}
        >
          <View style={styles.radioGroup}>
            <RadioButton.Item label="Nam" value="male" />
            <RadioButton.Item label="Nữ" value="female" />
          </View>
        </RadioButton.Group>

        {renderForm(healthFields.slice(1))}
        {renderOccupation(occupation)}
        <TouchableOpacity disabled={loading}><Button mode="contained" onPress={createHealthRecord} loading={loading} disabled={loading}>{loading ? "Đang tạo..." : "Tạo hồ sơ"}</Button></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 16,
    textAlign: "center",
    color: "#2c3e50",
  },
  createButton: {
    marginTop: 12,
    marginBottom: 20,
    borderRadius: 8,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  input: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    marginTop: 8,
    color: "#555",
  },
  radioGroup: {
    marginLeft: -10,
    marginBottom: 16,
  },
});

export default CreateHealthRecord;
