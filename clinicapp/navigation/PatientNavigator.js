import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Badge, Icon, useTheme } from "react-native-paper";
import { useNotification } from "../configs/NotificationContext";
import { View, StyleSheet } from "react-native";

// Screens
import Notification from "../screens/Patient/Notification";
import HealthRecordList from "../screens/Patient/HealthRecordList";
import Appointment from "../screens/Patient/Appointment";
import HospitalDetail from "../screens/Patient/HospitalDetail";
import Home from "../screens/Home";
import Schedule from "../screens/Patient/Schedule";
import ScheduleBooking from "../screens/Patient/ScheduleBooking";
import CreateHealthRecord from "../screens/Patient/CreateHealthRecord";
import DoctorList from "../screens/Patient/DoctorList";
import ProfileStack from "./ProfileStack";
import AppointmentDetails from "../screens/Patient/AppointmentDetails";
import ChatScreen from "../screens/Common/ChatScreen";
import UserList from "../screens/Common/UserList";
import Review from "../screens/Patient/Review";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HomeStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="HospitalDetail" component={HospitalDetail} options={{ title: "Giới thiệu", headerShown: true }} />
      <Stack.Screen name="DoctorList" component={DoctorList} />
      <Stack.Screen name="Schedule" component={Schedule} />
      <Stack.Screen name="ScheduleBooking" component={ScheduleBooking} />
      <Stack.Screen name="UserList" component={UserList} />
      <Stack.Screen name="ChatScreen" component={ChatScreen} />
      <Stack.Screen name="Review" component={Review} />
    </Stack.Navigator>
  );
};

const HealthRecorStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HealthRecordList" component={HealthRecordList} />
      <Stack.Screen name="CreateHealthRecord" component={CreateHealthRecord} />
    </Stack.Navigator>
  );
};

const AppointmentStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Appointment" component={Appointment} />
      <Stack.Screen name="AppointmentDetails" component={AppointmentDetails} />
    </Stack.Navigator>
  );
};

const NotificationStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Notification" component={Notification} />
    </Stack.Navigator>
  );
};

const PatientNavigator = () => {
  const { count } = useNotification();
  const theme = useTheme();

  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ tabBarLabel: "Trang chủ", tabBarIcon: ({ focused }) => <Icon size={30} source="home-outline" color={focused ? theme.colors.primary : 'black'} /> }} />
      <Tab.Screen name="HealthRecordTab" component={HealthRecorStack} options={{ tabBarLabel: "Hồ sơ", tabBarIcon: ({ focused }) => <Icon size={30} source="clipboard-plus-outline" color={focused ? theme.colors.primary : 'black'} /> }} />
      <Tab.Screen name="AppointmentTab" component={AppointmentStack} options={{ tabBarLabel: "Lịch khám", tabBarIcon: ({ focused }) => <Icon size={30} source="clipboard-text-outline" color={focused ? theme.colors.primary : 'black'} /> }} />
      <Tab.Screen name="NotificationTab" component={NotificationStack} options={{
        tabBarLabel: "Thông báo", tabBarIcon: ({ focused }) => (
          <View style={styles.iconWrapper}>
            <Icon size={30} source="bell-outline" color={focused ? theme.colors.primary : 'black'} />
            {count > 0 && (
              <Badge style={styles.badge}>{count}</Badge>
            )}
          </View>
        )
      }}
      />
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ tabBarLabel: "Tài khoản", tabBarIcon: ({ focused }) => <Icon size={30} source="account-outline" color={focused ? theme.colors.primary : 'black'} /> }} />
    </Tab.Navigator>
  );

}

const styles = StyleSheet.create({
  iconWrapper: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -8,
    backgroundColor: 'red',
    color: 'white',
    fontSize: 12,
  }
});

export default PatientNavigator;