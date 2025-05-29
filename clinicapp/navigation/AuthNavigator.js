import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Login from "../screens/Auth/Login";
import Register from "../screens/Auth/Register";
import { NavigationContainer } from "@react-navigation/native";
import PatientNavigator from "./PatientNavigator";
import DoctorNavigator from "./DoctorNavigator";
import ResetPassword from "../screens/Auth/ResetPassword";


const Stack = createNativeStackNavigator();
const StackNavigator = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen name="login" component={Login} options={{ title: "Đăng ký tài khoản" }} />
            <Stack.Screen name="register" component={Register} options={{ title: "Đăng ký tài khoản" }} />
            <Stack.Screen name="Patient" component={PatientNavigator} options={{ headerShown: false }} />
            <Stack.Screen name="Doctor" component={DoctorNavigator} options={{ headerShown: false }} />
            <Stack.Screen name="ResetPassword" component={ResetPassword} options={{ headerShown: false }} />
        </Stack.Navigator>
    );
};

const AuthNavigator = () => {
    return (
        <StackNavigator />
    );
}

export default AuthNavigator;