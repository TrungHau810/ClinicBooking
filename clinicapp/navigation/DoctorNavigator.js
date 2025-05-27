import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AppointmentDoctor from "../screens/Doctor/AppointmentDoctor";
import PatientHealthRecords from "../screens/Doctor/PatientHealthRecords";
import { Icon } from "react-native-paper";


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

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
            <Tab.Screen name="appointment" component={AppointmentDoctor} options={{ title: "Lịch hẹn", tabBarIcon: () => <Icon size={30} source="calendar-account" /> }} />
            <Tab.Screen name="healthrecord" component={PatientHealthRecords} options={{ title: "Hồ sơ sức khoẻ", tabBarIcon: () => <Icon size={30} source="clipboard-text-outline" /> }} />
        </Tab.Navigator>
    );
}


const DoctorNavigator = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen name="MainDoctor" component={TabNavigator} options={{headerShown: false}} />
        </Stack.Navigator>
    );
};

export default DoctorNavigator;