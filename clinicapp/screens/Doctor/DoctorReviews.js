import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Image,
    ScrollView,
    TouchableOpacity,
    Alert,
    SafeAreaView,
    Platform,
    StatusBar,
} from "react-native";
import { Card } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import StarRating from "react-native-star-rating-widget";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import Header from "../../components/Header";

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
dayjs.extend(relativeTime);
dayjs.locale('vi');

const DoctorReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [token, setToken] = useState("");
    const [replyInputs, setReplyInputs] = useState({});
    const [editingReplies, setEditingReplies] = useState({});


    // Tải danh sách đánh giá
    const loadReviews = async () => {
        const token = await AsyncStorage.getItem("token");
        setToken(token);

        // Gọi API lấy profile của bác sĩ hiện tại
        const profileRes = await authApis(token).get(endpoints['current-user']);
        const doctorId = profileRes.data.id;

        const url = `${endpoints['reviews']}?doctor=${doctorId}`;
        const res = await Apis.get(url);
        console.log(res.data);
        setReviews(res.data);
    };

    const init = async (setToken, loadReviews) => {
        const savedToken = await AsyncStorage.getItem("token");
        if (savedToken) {
            setToken(savedToken);
            loadReviews(savedToken);
        }
    };

    useEffect(() => {
        init(setToken, loadReviews);
    }, []);

    // Gửi phản hồi
    const handleReplySubmit = async (reviewId) => {
        const reply = replyInputs[reviewId];
        if (!reply || reply.trim() === "") {
            Alert.alert("Lỗi", "Vui lòng nhập nội dung phản hồi.");
            return;
        }

        try {
            await authApis(token).patch(`${endpoints["reviews"]}${reviewId}/reply/`, {
                reply: reply.trim(),
            });

            Alert.alert("Thành công", "Phản hồi đã được gửi.");
            setReplyInputs((prev) => ({ ...prev, [reviewId]: "" }));

            // Refresh lại danh sách sau khi phản hồi
            loadReviews(token);
        } catch (err) {
            console.error(err);
            Alert.alert("Lỗi", "Không thể gửi phản hồi.");
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }} >
            <Header title="Phản hồi đánh giá" />
            <View style={styles.container}>
                <ScrollView>
                    {reviews.length === 0 ? (
                        <Text style={styles.noReviews}>Chưa có đánh giá nào.</Text>
                    ) : (
                        reviews.map((r, index) => (
                            <Card key={index} style={styles.reviewCard}>
                                <Card.Content>
                                    <View style={styles.reviewHeader}>
                                        <Image source={{ uri: r.avatar_patient }} style={styles.avatar} />
                                        <View style={{ marginLeft: 12, flex: 1 }}>
                                            <Text style={styles.name}>{r.patient_name}</Text>
                                            <Text style={styles.timeAgo}>{dayjs(r.created_at).fromNow()}</Text>
                                            <StarRating
                                                rating={r.rating}
                                                starSize={18}
                                                onChange={() => { }}
                                                enableSwiping={false}
                                                enableHalfStar={false}
                                            />
                                        </View>
                                    </View>

                                    <Text style={styles.comment}>“{r.comment}”</Text>

                                    {editingReplies[r.id] ? (
                                        <View style={styles.replyForm}>
                                            <TextInput
                                                style={styles.replyInput}
                                                placeholder="Chỉnh sửa phản hồi..."
                                                value={replyInputs[r.id] || ""}
                                                onChangeText={(text) =>
                                                    setReplyInputs((prev) => ({ ...prev, [r.id]: text }))
                                                }
                                                multiline
                                            />
                                            <TouchableOpacity
                                                style={styles.replyButton}
                                                onPress={() => {
                                                    handleReplySubmit(r.id);
                                                    setEditingReplies((prev) => ({ ...prev, [r.id]: false }));
                                                }}
                                            >
                                                <Text style={styles.replyButtonText}>Cập nhật</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : r.reply ? (
                                        <TouchableOpacity
                                            onPress={() => {
                                                setReplyInputs((prev) => ({ ...prev, [r.id]: r.reply }));
                                                setEditingReplies((prev) => ({ ...prev, [r.id]: true }));
                                            }}
                                        >
                                            <View style={styles.replyBox}>
                                                <Text style={styles.replyLabel}>Phản hồi của bạn (bấm để chỉnh sửa):</Text>
                                                <Text style={styles.replyText}>{r.reply}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={styles.replyForm}>
                                            <TextInput
                                                style={styles.replyInput}
                                                placeholder="Nhập phản hồi..."
                                                value={replyInputs[r.id] || ""}
                                                onChangeText={(text) =>
                                                    setReplyInputs((prev) => ({ ...prev, [r.id]: text }))
                                                }
                                                multiline
                                            />
                                            <TouchableOpacity
                                                style={styles.replyButton}
                                                onPress={() => handleReplySubmit(r.id)}
                                            >
                                                <Text style={styles.replyButtonText}>Gửi</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                </Card.Content>
                            </Card>
                        ))
                    )}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f4f6f8",
        padding: 10,
    },
    noReviews: {
        textAlign: "center",
        fontStyle: "italic",
        color: "#888",
        marginTop: 24,
        fontSize: 16,
    },
    reviewCard: {
        marginBottom: 16,
        borderRadius: 12,
        backgroundColor: "#fff",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        padding: 12,
    },
    reviewHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: "#ddd",
    },
    name: {
        fontWeight: "600",
        fontSize: 16,
        marginBottom: 4,
    },
    comment: {
        fontSize: 15,
        color: "#333",
        fontStyle: "italic",
        marginBottom: 10,
        lineHeight: 20,
    },
    replyBox: {
        backgroundColor: "#eaf4ff",
        padding: 12,
        borderRadius: 10,
    },
    replyLabel: {
        color: "#1e88e5",
        fontWeight: "700",
        marginBottom: 4,
    },
    replyText: {
        color: "#333",
        fontSize: 15,
        lineHeight: 20,
    },
    replyForm: {
        marginTop: 8,
        backgroundColor: "#f0f2f5",
        padding: 10,
        borderRadius: 10,
    },
    replyInput: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        backgroundColor: "#fff",
        minHeight: 60,
        textAlignVertical: "top",
    },
    replyButton: {
        backgroundColor: "#2196F3",
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginTop: 10,
        borderRadius: 8,
        alignItems: "center",
    },
    replyButtonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
     timeAgo: {
        fontSize: 12,
        color: "#888",
        marginBottom: 4,
    },
});
export default DoctorReviews;
