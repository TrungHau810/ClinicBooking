import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";

const TestResultCard = ({ result }) => {
    return (
        <View style={styles.card}>
            <Text style={styles.name}>{result.test_name}</Text>
            <Text style={styles.description}>{result.description}</Text>
            {result.image && (
                <Image source={{ uri: result.image }} style={styles.image} />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#f8f8f8",
        padding: 12,
        borderRadius: 10,
        marginBottom: 12,
        elevation: 1,
    },
    name: { fontWeight: "bold", fontSize: 16, marginBottom: 4 },
    description: { fontSize: 14, color: "#555", marginBottom: 6 },
    image: { width: "100%", height: 200, borderRadius: 8 },
});

export default TestResultCard;
