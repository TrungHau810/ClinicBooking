import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Icon, useTheme, ActivityIndicator } from "react-native-paper";
import { View } from "react-native";
import { useContext, useEffect, useState } from "react";
import { MyUserContext } from "../configs/MyContexts";

import AppointmentDoctor from "../screens/Doctor/AppointmentDoctor";
import PatientHealthRecords from "../screens/Doctor/PatientHealthRecords";
import AppointmentCalendar from "../screens/Doctor/AppointmentCalendar";
import DoctorAppointmentDetails from "../screens/Doctor/DoctorAppointmentDetails";
import CreateMedicalResult from "../screens/Doctor/CreateMedicalResult";
import ProfileStack from "./ProfileStack";
import HomeDoctor from "../screens/Doctor/HomeDoctor";
import ChatScreen from "../screens/Common/ChatScreen";
import UserList from "../screens/Common/UserList";
import PatientHealthRecordDetail from "../screens/Doctor/PatientHealthRecordDetail";
import DoctorReport from "../screens/Doctor/DoctorReport";
import BlockedScreen from "../screens/Doctor/BlockedScreen";
import DoctorReviews from "../screens/Doctor/DoctorReviews";

import Apis, { endpoints } from "../configs/Apis";
import UploadLicense from "../screens/Doctor/UploadLicense";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const ChatStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="UserList" component={UserList} />
    <Stack.Screen name="ChatScreen" component={ChatScreen} />
  </Stack.Navigator>
);

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
            <Icon size={30} source="chart-bar" color={focused ? theme.colors.primary : "black"} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const DoctorNavigator = () => {
  const user = useContext(MyUserContext);
  const [isVerified, setIsVerified] = useState(null); // null = loading, true/false = loaded

  useEffect(() => {
    const fetchDoctorStatus = async () => {
      try {
        const res = await Apis.get(`${endpoints["doctor-detail"]}?user_id=${user?.payload?.id}`);
        setIsVerified(res.data.is_verified); // Đã là bác sĩ thật, check is_verified
      } catch (error) {
        if (error?.response?.status === 404) {
          // Chưa tạo bản ghi Doctor (mới chỉ có role "doctor")
          setIsVerified(false);
        } else {
          console.error("Lỗi khi load is_verified:", error);
          setIsVerified(true); // fallback: nếu lỗi server thì không chặn
        }
      }
    };

    if (user?.payload?.role === "doctor") {
      fetchDoctorStatus();
    } else {
      setIsVerified(true); // Các role khác không bị chặn
    }
  }, [user]);

  // Nếu đang loading thì hiện loading hoặc null
  if (isVerified === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator animating size="large" />
      </View>
    );
  }

  const isBlockedDoctor = user?.payload?.role === "doctor" && isVerified === false;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isBlockedDoctor ? (
        <>
          <Stack.Screen name="BlockedScreen" component={BlockedScreen} />
          <Stack.Screen name="UploadLicense" component={UploadLicense} />
        </>
      ) : (
        <>
          <Stack.Screen name="MainDoctor" component={TabNavigator} />
          <Stack.Screen name="ChatStack" component={ChatStack} />
          <Stack.Screen name="AppointmentCalendar" component={AppointmentCalendar} />
          <Stack.Screen name="DoctorAppointmentDetails" component={DoctorAppointmentDetails} />
          <Stack.Screen name="CreateMedicalResult" component={CreateMedicalResult} />
          <Stack.Screen name="PatientHealthRecordDetail" component={PatientHealthRecordDetail} />
          <Stack.Screen name="DoctorReviews" component={DoctorReviews} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default DoctorNavigator;