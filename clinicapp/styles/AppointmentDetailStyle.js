import { StyleSheet } from "react-native";

export default StyleSheet.create({
    container: {
        padding: 16,
        flex: 1,
        backgroundColor: "#fff",
    },
    cancelText: {
        color: "#e74c3c",
        marginTop: 10,
    },
    input: {
        marginTop: 20,
    },
    cancelBtn: {
        marginTop: 16,
        backgroundColor: "#e74c3c",
    },
    Rebtn: {
        marginTop: 16,
        backgroundColor: "#3498db",
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalContent: {
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 10,
        width: "90%",
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
    },
    modalInput: {
        minHeight: 80,
        marginBottom: 16,
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
    }, datePickerButton: {
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        marginBottom: 12,
    },
    timeOption: {
        padding: 10,
        marginBottom: 6,
        borderRadius: 4,
    },
    timeOptionSelected: {
        backgroundColor: "#3498db",
    },
    timeOptionUnselected: {
        backgroundColor: "#f0f0f0",
    },
    timeOptionTextSelected: {
        color: "#fff",
    },
    timeOptionTextUnselected: {
        color: "#000",
    },
});
