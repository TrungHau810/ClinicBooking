import { useState } from "react";
import { ScrollView, View } from "react-native";
import { Button, RadioButton, Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";


const HealthRecord = () => {

    const healthFields =[{
        label:"Họ tên (có dấu)",
    },{
        label:"Ngày sinh",
    },{
        label:"Giới tính",
    },{
        label:"Mã bảo hiểm y tế",
    },{
        label:"Số CCCD",
    },{
        label:"Email (Dùng để nhận phiếu khám bệnh)",
    },{
        label:"Số điện thoại",
    },{
        label:"Địa chỉ (Số nhà/Tên đường/Ấp thôn xóm)",
    },]
    

    const renderForm =(healthField)=>{
        return(
            healthField.map(field=><TextInput key={field.label} label={field.label}></TextInput>)
        );
    };

    return (
        <SafeAreaView>
            <Text>Hồ sơ bệnh nhân</Text>
            <Button mode="contained">Tạo mới</Button>

            <ScrollView>
                <Text>Thông tin chung</Text>

                {renderForm(healthFields)}
                {/* <TextInput label={'Họ tên (có dấu)'} mode="outlined"></TextInput>
                <TextInput label={'Ngày sinh'} mode="outlined"></TextInput>
                <TextInput label={'họ tên'} mode="outlined"></TextInput> */}
            </ScrollView>
        </SafeAreaView>
    );
}

export default HealthRecord;