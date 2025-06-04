import 'react-native-reanimated';
import { NavigationContainer } from "@react-navigation/native";
import AuthNavigator from "./navigation/AuthNavigator";
import { MyContextProvider } from "./configs/MyContexts";
import { NotificationProvider } from "./configs/NotificationContext";
import { theme } from "./theme";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from 'react-native-safe-area-context';


const App = () => {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <MyContextProvider>
          <NotificationProvider>
            <NavigationContainer>
              <AuthNavigator />
            </NavigationContainer>
          </NotificationProvider>
        </MyContextProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

export default App;