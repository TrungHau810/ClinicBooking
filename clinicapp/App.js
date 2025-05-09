import { NavigationContainer } from "@react-navigation/native";
import AuthNavigator from "./navigation/AuthNavigator";
import { MyContextProvider } from "./configs/MyContexts";


const App = () => {
  return (
    <MyContextProvider>
      <NavigationContainer>
        <AuthNavigator />
      </NavigationContainer>
    </MyContextProvider>
  );
}

export default App;