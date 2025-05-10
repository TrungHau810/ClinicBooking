import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Login from "../screens/Auth/Login";
import Register from "../screens/Auth/Register";
import { NavigationContainer } from "@react-navigation/native";
import PatientNavigator from "./PatientNavigator";
import SplashScreen from "../screens/Auth/Splash";


const Stack = createNativeStackNavigator();
const StackNavigator = () => {
    return (
        <Stack.Navigator>
            {/* <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} /> */}
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