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


import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, RadioButton, Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

const HealthRecord = () => {
  const [gender, setGender] = useState("male");

  const healthFields = [
    { label: "Họ tên (có dấu)", key: "name" },
    { label: "Ngày sinh", key: "dob" },
    { label: "Mã bảo hiểm y tế", key: "insurance" },
    { label: "Số CCCD", key: "cccd" },
    { label: "Email (Dùng để nhận phiếu khám bệnh)", key: "email" },
    { label: "Số điện thoại", key: "phone" },
    { label: "Địa chỉ (Số nhà/Tên đường/Ấp thôn xóm)", key: "address" },
  ];

  const renderForm = (fields) =>
    fields.map((field) => (
      <TextInput
        key={field.key}
        label={field.label}
        mode="outlined"
        style={styles.input}
      />
    ));

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Hồ sơ bệnh nhân</Text>

      <Button mode="contained" style={styles.createButton}>
        Tạo mới
      </Button>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.sectionTitle}>Thông tin chung</Text>

        {renderForm(healthFields.slice(0, 1))}

        <Text style={styles.label}>Giới tính</Text>
        <RadioButton.Group onValueChange={setGender} value={gender}>
          <View style={styles.radioGroup}>
            <RadioButton.Item label="Nam" value="male" />
            <RadioButton.Item label="Nữ" value="female" />
            <RadioButton.Item label="Khác" value="other" />
          </View>
        </RadioButton.Group>

        {renderForm(healthFields.slice(1))}
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

export default HealthRecord;
