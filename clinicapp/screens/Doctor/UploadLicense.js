import { useState } from "react";
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { endpoints } from "../../configs/Apis";
import Header from "../../components/Header";

const UploadLicense = ({ navigation }) => {
    const [licenseData, setLicenseData] = useState({
        license_number: "",
    });
    const [licenseImage, setLicenseImage] = useState(null);
    const [loading, setLoading] = useState(false);

    const setState = (value, field) => {
        setLicenseData({ ...licenseData, [field]: value });
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            setLicenseImage(result.assets[0]);
        }
    };

    const handleUpload = async () => {
        if (!licenseData.license_number || !licenseImage) {
            Alert.alert("Thiếu thông tin", "Vui lòng nhập số giấy phép và chọn ảnh.");
            return;
        }

        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("token");

            const form = new FormData();
            form.append("license_number", licenseData.license_number);
            form.append("license_image", {
                uri: licenseImage.uri,
                name: "license.jpg",
                type: "image/jpeg",
            });

            const res = await Apis.post(endpoints["upload-license"], form, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });
            if (res.status === 201) {
                Alert.alert("Thành công", res.data.message, [
                    { text: "OK", onPress: () => navigation.goBack() },
                ]);
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Lỗi", "Bạn không phải là bác sĩ hoặc có lỗi xảy ra.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Header title={"Upload giấy phép hành nghề"} />
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.sectionTitle}>Tải lên giấy phép hành nghề</Text>

                <TextInput
                    label="Số giấy phép hành nghề"
                    mode="outlined"
                    style={styles.input}
                    value={licenseData.license_number}
                    onChangeText={(text) => setState(text, "license_number")}
                />

                <Text style={styles.label}>Ảnh giấy phép</Text>
                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                    {licenseImage ? (
                        <Image source={{ uri: licenseImage.uri }} style={styles.image} />
                    ) : (
                        <Text style={styles.imageText}>Chọn ảnh từ thư viện</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity disabled={loading}>
                    <Button
                        mode="contained"
                        onPress={handleUpload}
                        loading={loading}
                        disabled={loading}
                        style={styles.uploadButton}
                    >
                        {loading ? "Đang gửi..." : "Gửi giấy phép"}
                    </Button>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

export default UploadLicense;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        paddingHorizontal: 16,
    },
    scrollContainer: {
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 16,
        color: "#333",
    },
    input: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        marginTop: 8,
        color: "#555",
    },
    imagePicker: {
        height: 200,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        marginBottom: 20,
    },
    image: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    imageText: {
        color: "#888",
    },
    uploadButton: {
        marginTop: 10,
        borderRadius: 50,
    },
});
