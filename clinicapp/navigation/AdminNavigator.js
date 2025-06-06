import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Icon, useTheme } from "react-native-paper";

import Profile from "../screens/Common/Profile";
import AdminReport from "../screens/Admin/AdminReport";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabNavigator = () => {
    const theme = useTheme();

    return (
        <Tab.Navigator screenOptions={{ headerShown: false }}>
            <Tab.Screen
                name="Profile"
                component={Profile}
                options={{
                    tabBarLabel: "Tài khoản",
                    tabBarIcon: ({ focused }) => (
                        <Icon
                            size={30}
                            source="account-outline"
                            color={focused ? theme.colors.primary : "black"}
                        />
                    ),
                }}
            />
            <Tab.Screen
                name="AdminReport"
                component={AdminReport}
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
        </Tab.Navigator >
    );
};

const AdminNavigator = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="MainAdmin"
                component={TabNavigator}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
};

export default AdminNavigator;
