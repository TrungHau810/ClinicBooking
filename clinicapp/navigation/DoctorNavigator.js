import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Icon, useTheme } from "react-native-paper";
import { View, StyleSheet } from "react-native";

import AppointmentDoctor from "../screens/Doctor/AppointmentDoctor";
import PatientHealthRecords from "../screens/Doctor/PatientHealthRecords";
import AppointmentCalendar from "../screens/Doctor/AppointmentCalendar";
import DoctorAppointmentDetails from "../screens/Doctor/DoctorAppointmentDetails";
import CreateMedicalResult from "../screens/Doctor/CreateMedicalResult";
import Profile from "../screens/Common/Profile";
import HomeDoctor from "../screens/Doctor/HomeDoctor";
import ChatScreen from "../screens/Common/ChatScreen";
import UserList from "../screens/Common/UserList";
import PatientHealthRecordDetail from "../screens/Doctor/PatientHealthRecordDetail";
import DoctorReport from "../screens/Doctor/DoctorReport";
import ProfileStack from "./ProfileStack";
import EditProfile from "../screens/Common/EditProfile";
import UploadLicense from "../screens/Doctor/UploadLicense";

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

const TabNavigator = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="HomeDoctor"
        component={HomeDoctor}
        options={{
          tabBarLabel: "Trang chủ",
          tabBarIcon: ({ focused }) => (
            <Icon size={30} source="home-outline" color={focused ? theme.colors.primary : "black"} />
          ),
        }}
      />
      <Tab.Screen
        name="Appointment"
        component={AppointmentDoctor}
        options={{
          tabBarLabel: "Lịch hẹn",
          tabBarIcon: ({ focused }) => (
            <Icon size={30} source="calendar-account" color={focused ? theme.colors.primary : "black"} />
          ),
        }}
      />
      <Tab.Screen
        name="HealthRecords"
        component={PatientHealthRecords}
        options={{
          tabBarLabel: "Hồ sơ",
          tabBarIcon: ({ focused }) => (
            <Icon size={30} source="clipboard-text-outline" color={focused ? theme.colors.primary : "black"} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarLabel: "Tài khoản",
          tabBarIcon: ({ focused }) => (
            <Icon size={30} source="account-outline" color={focused ? theme.colors.primary : "black"} />
          ),
        }}
      />
      <Tab.Screen
        name="DoctorReport"
        component={DoctorReport}
        options={{
          tabBarLabel: "Báo cáo",
          tabBarIcon: ({ focused }) => (
            <Icon
              size={30}
              source="chart-bar"
              color={focused ? theme.colors.primary : "black"}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const DoctorNavigator = () => {

  return (
    <Stack.Navigator>
      <Stack.Screen name="MainDoctor" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="ChatStack" component={ChatStack} options={{ headerShown: false }} />
      <Stack.Screen name="AppointmentCalendar" component={AppointmentCalendar} options={{ headerShown: false }} />
      <Stack.Screen name="DoctorAppointmentDetails" component={DoctorAppointmentDetails} options={{ headerShown: false }} />
      <Stack.Screen name="CreateMedicalResult" component={CreateMedicalResult} />
      <Stack.Screen name="PatientHealthRecordDetail" component={PatientHealthRecordDetail} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

export default DoctorNavigator;