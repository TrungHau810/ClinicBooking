import { useEffect, useState } from "react";
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
import { Picker } from "@react-native-picker/picker";
import Apis, { endpoints } from "../../configs/Apis";
import Header from "../../components/Header";

const UploadLicense = ({ navigation }) => {
    const [licenseData, setLicenseData] = useState({
        license_number: "",
        hospital: "",
        specialization: "",
        biography: "",
    });
    const [licenseImage, setLicenseImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [hospitals, setHospitals] = useState([]);
    const [specializations, setSpecializations] = useState([]);

    const fetchData = async () => {
        try {
            const [hosRes, speRes] = await Promise.all([
                Apis.get(endpoints["hospitals"]),
                Apis.get(endpoints["specializations"]),
            ]);
            setHospitals(hosRes.data);
            setSpecializations(speRes.data);
        } catch (err) {
            console.error("Lỗi tải bệnh viện hoặc chuyên khoa:", err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

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
        const { license_number, hospital, specialization, biography } = licenseData;

        if (!license_number || !hospital || !specialization || !biography || !licenseImage) {
            Alert.alert(
                "Thiếu thông tin",
                "Vui lòng điền đầy đủ các trường: Số giấy phép, Bệnh viện, Chuyên khoa, Tiểu sử và chọn ảnh."
            );
            return;
        }

        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("token");

            const form = new FormData();
            form.append("license_number", license_number);
            form.append("hospital", hospital);
            form.append("specialization", specialization);
            form.append("biography", biography);
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
                <Text style={styles.sectionTitle}>Điền thông tin & tải giấy phép</Text>

                <Text style={styles.label}>Bệnh viện</Text>
                <View style={styles.pickerWrapper}>
                    <Picker
                        selectedValue={licenseData.hospital}
                        onValueChange={(value) => setState(value, "hospital")}
                    >
                        <Picker.Item label="-- Chọn bệnh viện --" value="" />
                        {hospitals.map((h) => (
                            <Picker.Item key={h.id} label={h.name} value={h.id} />
                        ))}
                    </Picker>
                </View>

                <Text style={styles.label}>Chuyên khoa</Text>
                <View style={styles.pickerWrapper}>
                    <Picker
                        selectedValue={licenseData.specialization}
                        onValueChange={(value) => setState(value, "specialization")}
                    >
                        <Picker.Item label="-- Chọn chuyên khoa --" value="" />
                        {specializations.map((s) => (
                            <Picker.Item key={s.id} label={s.name} value={s.id} />
                        ))}
                    </Picker>
                </View>

                <TextInput
                    label="Tiểu sử"
                    mode="outlined"
                    multiline
                    numberOfLines={4}
                    style={styles.input}
                    value={licenseData.biography}
                    onChangeText={(text) => setState(text, "biography")}
                />

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

                <Button
                    mode="contained"
                    onPress={handleUpload}
                    loading={loading}
                    disabled={loading}
                    style={styles.uploadButton}
                >
                    {loading ? "Đang gửi..." : "Gửi giấy phép"}
                </Button>
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
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center",
        color: "#0A84FF",
    },
    label: {
        fontSize: 16,
        marginBottom: 6,
        color: "#333",
        fontWeight: "600",
    },
    input: {
        backgroundColor: "#f5f5f5",
        marginBottom: 16,
        borderRadius: 8,
    },
    pickerWrapper: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        marginBottom: 16,
        backgroundColor: "#f9f9f9",
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
        backgroundColor: "#f0f0f0",
    },
    image: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    imageText: {
        color: "#888",
        fontSize: 16,
    },
    uploadButton: {
        marginTop: 10,
        borderRadius: 30,
        paddingVertical: 8,
    },
});
