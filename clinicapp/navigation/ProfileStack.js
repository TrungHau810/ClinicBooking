import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Profile from "../screens/Common/Profile";
import EditProfile from "../screens/Common/EditProfile";

const Stack = createNativeStackNavigator();

const ProfileStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Profile" component={Profile} />
            <Stack.Screen name="EditProfile" component={EditProfile} />
        </Stack.Navigator>
    );
};

export default ProfileStack;