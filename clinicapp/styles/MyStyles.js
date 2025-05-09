import { Dimensions, StyleSheet } from "react-native";
// import { theme } from "../theme";

const { width } = Dimensions.get('window');

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    background: {
        // backgroundColor: theme.color.background
    },
    title: {
        fontSize: 25,
        fontWeight: 'bold',
        // color: theme.color.primary
    },
    slide: {
        width: width,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    image: {
        width: 150,
        height: 150,
        marginBottom: 30,
        resizeMode: 'contain',
    },
    footer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontSize: 18,
        // color: theme.color.primary,
        textAlign: 'center'
    },
    danger: {
        color: 'red'
    },
    row: {
        flexDirection: "row",
        justifyContent: 'space-between'
    },
    wrap: {
        flexWrap: "wrap"
    },
    m: {
        margin: 5
    },
    p: {
        padding: 5
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 50
    },
});