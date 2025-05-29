import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Badge, Icon } from "react-native-paper";
import Notification from "../screens/Patient/Notification";
import HealthRecordList from "../screens/Patient/HealthRecordList";
import Appointment from "../screens/Patient/Appointment";
import HospitalDetail from "../screens/Patient/HospitalDetail";
import Profile from "../screens/Patient/Profile";
import Home from "../screens/Home";
import Schedule from "../screens/Patient/Schedule";
import ScheduleBooking from "../screens/Patient/ScheduleBooking";
import CreateHealthRecord from "../screens/Patient/CreateHealthRecord";
import DoctorList from "../screens/Patient/DoctorList";
import { useNotification } from "../configs/NotificationContext";
import { View, StyleSheet } from "react-native";

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
    const { count } = useNotification();
    return (
        <Tab.Navigator>
            <Tab.Screen name="home" component={Home} options={{ title: "Trang chủ", headerShown: false, tabBarIcon: () => <Icon size={30} source="home" /> }} />
            <Tab.Screen name="healthrecordList" component={HealthRecordList} options={{ title: "Hồ sơ", headerShown: false, tabBarIcon: () => <Icon size={30} source="clipboard-plus" /> }} />
            <Tab.Screen name="appointment" component={Appointment} options={{ title: "Lịch khám", headerShown: false, tabBarIcon: () => <Icon size={30} source="clipboard-text-outline" /> }} />
            <Tab.Screen name="notification" component={Notification}
        options={{
          title: "Thông báo",
          headerShown: false,
          tabBarIcon: () => (
            <View style={styles.iconWrapper}>
              <Icon size={30} source="bell" />
              {count > 0 && (
                <Badge style={styles.badge}>{count}</Badge>
              )}
            </View>
          )
        }}
      />
            <Tab.Screen name="profile" component={Profile} options={{ title: "Tài khoản", headerShown: false, tabBarIcon: () => <Icon size={30} source="account" /> }} />
        </Tab.Navigator>
    );
}

const PatientNavigator = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen name="tabs" component={TabNavigator} options={{ headerShown: false }} />
            <Stack.Screen name="doctorList" component={DoctorList} options={{ headerShown: true, title: 'Danh sách bác sĩ' }} />
            <Stack.Screen name="hospitaldetails" component={HospitalDetail} options={{ headerShown: true, title: 'Chi tiết bệnh viện' }} />
            <Stack.Screen name="createHealthRecord" component={CreateHealthRecord} options={{title: "Tạo hồ sơ sức khoẻ"}} />
            <Stack.Screen name="Schedule" component={Schedule} options={{headerShown: true, title:'Đặt lịch khám'}} />
            <Stack.Screen name="scheduleBooking" component={ScheduleBooking}/>
        </Stack.Navigator>
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