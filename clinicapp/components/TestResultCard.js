import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import ImageViewing from "react-native-image-viewing";

const TestResultCard = ({ result }) => {
    const [visible, setVisible] = useState(false);

    return (
        <View style={styles.recordBox}>
            <View style={styles.card}>
                <Text style={styles.name}>{result.test_name}</Text>
                <Text style={styles.description}>{result.description}</Text>

                {result.image && (
                    <>
                        <TouchableOpacity onPress={() => setVisible(true)}>
                            <Image source={{ uri: result.image }} style={styles.image} />
                        </TouchableOpacity>

                        <ImageViewing
                            images={[{ uri: result.image }]}
                            imageIndex={0}
                            visible={visible}
                            onRequestClose={() => setVisible(false)}
                        />
                    </>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#f8f8f8",
        padding: 12,
        borderRadius: 10,
        elevation: 1,
    },
    name: {
        fontWeight: "bold",
        fontSize: 16,
        marginBottom: 4
    },
    description: {
        fontSize: 14,
        color: "#555",
        marginBottom: 6
    },
    image: {
        width: "100%",
        height: 200,
        borderRadius: 8
    },
    recordBox: {
        borderWidth: 1,
        borderColor: "#000",
        borderRadius: 6,
        backgroundColor: "#fff",
        marginBottom: 8,
        marginTop: 8,
        marginHorizontal: 10,
    },
});

export default TestResultCard;
