import React, { useState } from "react";
import { View, StyleSheet, TextInput, Image, Alert, ScrollView, TouchableOpacity, Platform } from "react-native";
import { Button, Text } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute, useNavigation } from "@react-navigation/native";
import Apis, { endpoints } from "../../configs/Apis";

const CreateMedicalTestResult = () => {
    const navigation = useNavigation();
    const { appointmentId, patientName, healthRecordId } = useRoute().params;

    const [testName, setTestName] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState(null);
    const [uploading, setUploading] = useState(false);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== "granted") {
            Alert.alert("Quyền truy cập bị từ chối", "Bạn cần cấp quyền để chọn ảnh.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled && result.assets.length > 0) {
            setImage(result.assets[0]);
        }
    };

    const handleSubmit = async () => {
        let res;
        if (!testName || !image) {
            Alert.alert("Lỗi", "Tên xét nghiệm và ảnh là bắt buộc.");
            return;
        }

        try {
            setUploading(true);
            const token = await AsyncStorage.getItem("token");

            const formData = new FormData();
            formData.append("test_name", testName);
            formData.append("description", description);
            formData.append("health_record", healthRecordId);
            formData.append("image", {
                uri: image.uri,
                name: image.fileName || `test-${Date.now()}.jpg`,
                type: image.mimeType || "image/jpeg",
            });
            console.log("FORMDATA", formData);
            const res = await Apis.post(endpoints["testresults"], formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${token}`,
                },
            });

            console.info(res);

            Alert.alert("Thành công", "Đã tạo kết quả xét nghiệm.");
            navigation.goBack(); // hoặc navigation.navigate('TestResultList')
        } catch (err) {
            console.error("Lỗi upload:", err?.response?.data || err.message);
            console.log('--------------------');
            console.log("Form Data:");
            console.log("test_name:", testName);
            console.log("description:", description);
            console.log("health_record:", healthRecordId);
            console.log("image:", {
                uri: image.uri,
                name: image.fileName || `test-${Date.now()}.jpg`,
                type: image.mimeType || "image/jpeg",
            });

            if (res) {
                console.log("Response:", res);
                console.log("Response Data:", res.data);
            }

            Alert.alert("Thất bại", "Không thể tạo kết quả. Kiểm tra dữ liệu hoặc kết nối.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Tạo kết quả xét nghiệm cho: {patientName}</Text>

            <Text style={styles.label}>Tên xét nghiệm *</Text>
            <TextInput
                style={styles.input}
                placeholder="Nhập tên xét nghiệm"
                value={testName}
                onChangeText={setTestName}
            />

            <Text style={styles.label}>Mô tả</Text>
            <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="Nhập mô tả"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
            />

            <Text style={styles.label}>Ảnh kết quả *</Text>
            <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage}>
                {image ? (
                    <Image source={{ uri: image.uri }} style={styles.avatar} />
                ) : (
                    <View style={{ alignItems: 'center' }}>
                        <Image
                            //source={require("../../assets/icon-camera.png")} // dùng ảnh camera mặc định
                            style={{ width: 40, height: 40, marginBottom: 8, tintColor: "#888" }}
                        />
                        <Text style={{ color: "#888" }}>Chạm để chọn ảnh</Text>
                    </View>
                )}
            </TouchableOpacity>

            <Button
                mode="contained"
                onPress={handleSubmit}
                loading={uploading}
                style={styles.submitButton}
            >
                Gửi kết quả
            </Button>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: "#fff",
    },
    title: {
        fontSize: 20,
        marginBottom: 20,
        fontWeight: "bold",
        textAlign: "center",
    },
    label: {
        fontSize: 15,
        marginTop: 10,
        marginBottom: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        backgroundColor: "#f9f9f9",
    },
    multiline: {
        height: 100,
        textAlignVertical: "top",
    },
    avatarWrapper: {
        height: 160,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#ccc',
        borderStyle: 'dashed',
        marginBottom: 16,
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        borderRadius: 12,
    },
    submitButton: {
        backgroundColor: "#27ae60",
        marginTop: 16,
        paddingVertical: 6,
    },
});

export default CreateMedicalTestResult;
