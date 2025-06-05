import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/Header";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import HealthRecordCard from "../../components/HealthRecordCard";


const TestResult = () => {

    const [healthrecords, setHealthRecords] = useState([]);

    const loadHealthRecord = async () => {
        const token = await AsyncStorage.getItem("token");

        let res = await authApis(token).get(endpoints['healthrecords']);
        setHealthRecords(res.data);
    };

    const loadTestResults=async()=>{
        let res = await Apis.get(endpoints['testresults'])
    };


    useEffect(() => {
        loadHealthRecord();
        console.log(healthrecords);
    }, []);

    return (
        <SafeAreaView>
            <Header title={"Kết quả xét nghiệm"} />
            <Text>Chọn hồ sơ để xem kết quả xét nghiệm</Text>
            {healthrecords.map((record, index) => (
                <HealthRecordCard key={index} record={record} />
            ))}
        </SafeAreaView>
    );
};

export default TestResult;