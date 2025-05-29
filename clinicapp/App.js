import { NavigationContainer } from "@react-navigation/native";
import AuthNavigator from "./navigation/AuthNavigator";
import { MyContextProvider } from "./configs/MyContexts";
import { NotificationProvider } from "./configs/NotificationContext";


const App = () => {
  return (
    <MyContextProvider>
      <NotificationProvider>
        <NavigationContainer>
          <AuthNavigator />
        </NavigationContainer>
      </NotificationProvider>
    </MyContextProvider>
  );
}

export default App;