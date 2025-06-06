import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Login from "../screens/Auth/Login";
import Register from "../screens/Auth/Register";
import { NavigationContainer } from "@react-navigation/native";
import PatientNavigator from "./PatientNavigator";
import DoctorNavigator from "./DoctorNavigator";
import ResetPassword from "../screens/Auth/ResetPassword";
import EditProfile from "../screens/Common/EditProfile";
import AdminNavigator from "./AdminNavigator";


const Stack = createNativeStackNavigator();
const StackNavigator = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={Register} options={{ title: "Đăng ký tài khoản" }} />
            <Stack.Screen name="ResetPassword" component={ResetPassword} options={{ title: "Đặt lại mật khẩu", headerShown: true }} />
            <Stack.Screen name="Patient" component={PatientNavigator} options={{ headerShown: false }} />
            <Stack.Screen name="Doctor" component={DoctorNavigator} options={{ headerShown: false }} />
            <Stack.Screen name="Admin" component={AdminNavigator} options={{ headerShown: false }} />
        </Stack.Navigator>
    );
};

const AuthNavigator = () => {
    return (
        <StackNavigator />
    );
}

export default AuthNavigator;