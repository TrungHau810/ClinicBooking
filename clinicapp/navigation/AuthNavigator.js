import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Login from "../screens/Auth/Login";
import Register from "../screens/Auth/Register";
import { NavigationContainer } from "@react-navigation/native";
import PatientNavigator from "./PatientNavigator";


const Stack = createNativeStackNavigator();
const StackNavigator = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen name="Đăng nhập" component={Login} />
            <Stack.Screen name="Đăng ký" component={Register} />
            <Stack.Screen name="Patient" component={PatientNavigator} options={{ headerShown: false }} />
        </Stack.Navigator>
    );
};

const AuthNavigator = () => {
    return (
        <StackNavigator />
    );

}

export default AuthNavigator;