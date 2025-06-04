import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Icon } from "react-native-paper";

import AppointmentDoctor from "../screens/Doctor/AppointmentDoctor";
import PatientHealthRecords from "../screens/Doctor/PatientHealthRecords";
import AppointmentCalendar from "../screens/Doctor/AppointmentCalendar";
import DoctorAppointmentDetails from "../screens/Doctor/DoctorAppointmentDetails";
import CreateMedicalResult from "../screens/Doctor/CreateMedicalResult";
import Profile from "../screens/Common/Profile";
import Home from "../screens/Home"
import ChatScreen from "../screens/Common/ChatScreen";
import UserList from "../screens/Common/UserList";
import PatientHealthRecordDetail from "../screens/Doctor/PatientHealthRecordDetail";


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const ChatStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="UserList" component={UserList} />
            <Stack.Screen name="ChatScreen" component={ChatScreen} />
        </Stack.Navigator>
    );
};

const StackNavigator = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen name="appointmentdoctor" component={AppointmentDoctor} />
            <Stack.Screen name="patienthealthrecord" component={PatientHealthRecords} />
        </Stack.Navigator>
    );

};

const TabNavigator = () => {
    return (
        <Tab.Navigator>
            <Tab.Screen name="Home" component={AppointmentDoctor} options={{ title: "Lịch hẹn", tabBarIcon: () => <Icon size={30} source="calendar-account" /> }} />
            <Tab.Screen name="appointment" component={AppointmentDoctor} options={{ title: "Lịch hẹn", tabBarIcon: () => <Icon size={30} source="calendar-account" /> }} />
            <Tab.Screen name="healthrecord" component={PatientHealthRecords} options={{ title: "Hồ sơ sức khoẻ", tabBarIcon: () => <Icon size={30} source="clipboard-text-outline" /> }} />
            <Tab.Screen name="profile" component={Profile} options={{ title: "Tài khoản", headerShown: false, tabBarIcon: () => <Icon size={30} source="account" /> }} />
        </Tab.Navigator>
    );
}


const DoctorNavigator = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen name="MainDoctor" component={TabNavigator} options={{ headerShown: false }} />
            <Stack.Screen name="ChatStack" component={ChatStack} options={{ title: "Chat" }} />
            <Stack.Screen name="AppointmentCalendar" component={AppointmentCalendar} />
            <Stack.Screen name="DoctorAppointmentDetails" component={DoctorAppointmentDetails} />
            <Stack.Screen name="CreateMedicalResult" component={CreateMedicalResult} />
            <Stack.Screen name="PatientHealthRecordDetail" component={PatientHealthRecordDetail} />
        </Stack.Navigator>
    );
};

export default DoctorNavigator;