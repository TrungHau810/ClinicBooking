import { DefaultTheme } from "react-native-paper";


export const theme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        primary: "#17A2F3",
        accent: "#000000",
        background: "#E0F7FA",
        surface: "#FFFFFF",
        error: "#F44336",
        text: "#212121", 
        onSurface: "#212121", 
        disabled: "#BDBDBD",
        placeholder: "#9E9E9E",
        backdrop: "rgba(0, 0, 0, 0.3)", 
        notification: "#FF7043",
    },
    roundness: 10,
    fonts: {
        ...DefaultTheme.fonts,
    },
}