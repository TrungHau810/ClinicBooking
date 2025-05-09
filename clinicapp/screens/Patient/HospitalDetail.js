import { useEffect, useState } from "react";
import { Card, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import Apis, { endpoints } from "../../configs/Apis";
import { ScrollView, View } from "react-native";
import RenderHTML from "react-native-render-html";


const HospitalDetail = ({ route }) => {

    const [hospitaldetail, setHospitalDetail] = useState([]);
    const hospitalId = route.params?.hospitalId;

    const loadingHospitalDetail = async () => {
        let res = await Apis.get(endpoints['hospital-details'](hospitalId));
        setHospitalDetail(res.data);
    }

    useEffect(() => {
        loadingHospitalDetail();
    }, [hospitalId]);

    const renderHospitalDetail = (item) => {
        return (
            <ScrollView>
                <Card>
                    <Card.Title title={item.name}  />
                    <Card.Cover source={{ uri: item.image }} />
                    <Card.Content>
                        {/* <Text>{item.description}</Text> */}
                        {/* <RenderHTMLSource source={{html: item.description}}/> */}
                        <RenderHTML source={{html: item.description}} />
                    </Card.Content>
                </Card>
            </ScrollView>

        );
    };

    return (
        <SafeAreaView>
            {renderHospitalDetail(hospitaldetail)}
        </SafeAreaView>
    );
};

export default HospitalDetail;