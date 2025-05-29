import 'react-native-reanimated';
import { NavigationContainer } from "@react-navigation/native";
import AuthNavigator from "./navigation/AuthNavigator";
import { MyContextProvider } from "./configs/MyContexts";
import { NotificationProvider } from "./configs/NotificationContext";
import { theme } from "./theme";
import { PaperProvider } from "react-native-paper";


const App = () => {
  return (
    <PaperProvider theme={theme}>
      <MyContextProvider>
        <NotificationProvider>
          <NavigationContainer>
            <AuthNavigator />
          </NavigationContainer>
        </NotificationProvider>
      </MyContextProvider>
    </PaperProvider>
  );
}

export default App;