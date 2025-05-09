import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Icon } from "react-native-paper";
import Notification from "../screens/Patient/Notification";
import HealthRecord from "../screens/Patient/HealthRecord";
import Appointment from "../screens/Patient/Appointment";
import DoctorBooking from "../screens/Patient/DoctorBooking";
import HospitalDetail from "../screens/Patient/HospitalDetail";
import Profile from "../screens/Patient/Profile";
import Home from "../screens/Home";

const Stack = createNativeStackNavigator();
// const StackNavigator = () => {
//     return (
//         <Stack.Navigator>
//             <Stack.Screen name="home" component={Home} options={{ title: "Trang chủ", headerShown: false }} />
//             <Stack.Screen name="healtrecord" component={HealthRecord} options={{ title: "Hồ sơ sức khoẻ", headerShown: true }} />
//             <Stack.Screen name="appointment" component={Appointment} options={{ title: "Lịch khám", headerShown: true }} />
//             <Stack.Screen name="profile" component={Profile} options={{ title: "Tài khoản", headerShown: true }} />
//             <Stack.Screen name="notification" component={Notification} options={{ title: "Thông b", headerShown: true }} />
//             <Stack.Screen name="doctorbooking" component={DoctorBooking} options={{ title: "Danh sách bác sĩ", headerShown: true }} />
//         </Stack.Navigator>
//     );
// };

const Tab = createBottomTabNavigator();
const TabNavigator = () => {
    return (
        <Tab.Navigator>
            <Tab.Screen name="home" component={Home} options={{ title: "Trang chủ", headerShown: false, tabBarIcon: () => <Icon size={30} source="home" /> }} />
            <Tab.Screen name="healthrecord" component={HealthRecord} options={{ title: "Hồ sơ", headerShown: false, tabBarIcon: () => <Icon size={30} source="clipboard-plus" /> }} />
            <Tab.Screen name="appointment" component={Appointment} options={{ title: "Lịch khám", headerShown: false, tabBarIcon: () => <Icon size={30} source="clipboard-text-outline" /> }} />
            <Tab.Screen name="notification" component={Notification} options={{ title: "Thông báo", headerShown: false, tabBarIcon: () => <Icon size={30} source="bell" /> }} />
            <Tab.Screen name="profile" component={Profile} options={{ title: "Tài khoản", headerShown: false, tabBarIcon: () => <Icon size={30} source="account" /> }} />
        </Tab.Navigator>
    );
}

const PatientNavigator = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen name="tabs" component={TabNavigator} options={{ headerShown: false }} />
            <Stack.Screen name="doctorbooking" component={DoctorBooking} options={{ headerShown: true, title: 'Danh sách bác sĩ' }} />
            <Stack.Screen name="hospitaldetails" component={HospitalDetail} options={{ headerShown: true, title: 'Chi tiết bệnh viện' }} />
        </Stack.Navigator>
    );

}

export default PatientNavigator;