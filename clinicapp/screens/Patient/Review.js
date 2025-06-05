import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput, Alert, Image, ScrollView } from "react-native";
import { Button, Card } from "react-native-paper";
import { useRoute } from "@react-navigation/native";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import StarRating from "react-native-star-rating-widget";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/Header";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Review = () => {
    const route = useRoute();
    const { doctor } = route.params;
    const [reviews, setReviews] = useState([]);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState("");

    const loadReview = async () => {
        let token = await AsyncStorage.getItem('token');
        setToken(token);
        let url = `${endpoints['reviews']}?doctor=${doctor.user.id}`
        let res = await Apis.get(url);
        console.info('----TB---', typeof (doctor.average_rating));
        setReviews(res.data);
    }

    const submitReview = async () => {
        console.log(rating, comment);
        try {
            setLoading(true);
            if (rating === 0 || !comment.trim()) {
                Alert.alert("Lỗi", "Vui lòng nhập đủ thông tin đánh giá.");
                return;
            }
            console.log(token);
            await authApis(token).post(endpoints["reviews"], {
                rating,
                comment,
                doctor: doctor.user.id
            });

            Alert.alert("Thành công", "Cảm ơn bạn đã đánh giá!");
            loadReview();
        } catch (error) {
            console.error(error.config);
            Alert.alert("Lỗi", "Không thể gửi đánh giá. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReview();
        console.log('------', reviews);
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <Header title="Đánh giá bác sĩ" />
            <Card style={styles.doctorCard}>
                <Card.Title title={`Bác sĩ ${doctor.doctor}`} />
                <Card.Content style={styles.cardContent}>
                    <Image style={styles.avatar} source={{ uri: doctor.avatar }} />
                    <View style={styles.info}>
                        <Text style={styles.text}>Chuyên khoa: {doctor.specialization_name}</Text>
                        <Text style={styles.text}>Cơ sở: {doctor.hospital_name}</Text>
                        <View style={styles.ratingRow}>
                            <StarRating
                                rating={Math.round(doctor.average_rating * 2) / 2}
                                starSize={20}
                                enableSwiping={false}
                                onChange={() => { }}
                            />
                            <Text style={styles.averageText}>{doctor.average_rating.toFixed(1)} / 5</Text>
                        </View>
                    </View>
                </Card.Content>
            </Card>

            <ScrollView>
                <Text style={styles.subTitle}>Đánh giá của bạn</Text>

                <StarRating rating={rating} onChange={setRating} starSize={30} enableHalfStar={false} />

                <TextInput
                    style={styles.input}
                    placeholder="Nhập nhận xét của bạn..."
                    multiline
                    value={comment}
                    onChangeText={setComment}
                />

                <Button mode="contained" style={styles.button} disabled={loading} loading={loading} onPress={submitReview}>
                    Gửi đánh giá
                </Button>


                <Text style={styles.subTitle}>Các đánh giá trước đó</Text>

                {reviews.length === 0 ? (
                    <Text style={styles.noReviews}>Chưa có đánh giá nào.</Text>
                ) : (
                    reviews.map((r, idx) => (
                        <Card key={idx} style={styles.reviewCard}>
                            <Card.Content>
                                <View style={styles.reviewHeader}>
                                    <Image source={{ uri: r.avatar_patient }} style={styles.reviewAvatar} />
                                    <View style={{ marginLeft: 10 }}>
                                        <Text style={styles.reviewer}>{r.patient_name}</Text>
                                        <StarRating
                                            rating={r.rating}
                                            onChange={() => { }}
                                            starSize={18}
                                            enableSwiping={false}
                                            enableHalfStar={false}
                                            starStyle={{ marginRight: 2 }}
                                        />
                                    </View>
                                </View>
                                <Text style={styles.comment}>{r.comment}</Text>
                                {r.reply ? (
                                    <View style={styles.replyBox}>
                                        <Text style={styles.replyLabel}>Phản hồi của bác sĩ:</Text>
                                        <Text style={styles.replyText}>{r.reply}</Text>
                                    </View>
                                ) : null}
                            </Card.Content>
                        </Card>
                    ))
                )}

            </ScrollView>
        </SafeAreaView>

    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: "#fff",
        flex: 1,
    },
    doctorCard: {
        marginBottom: 16,
    },
    cardContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    info: {
        marginLeft: 12,
    },
    text: {
        fontSize: 14,
    },
    subTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginVertical: 12,
    },
    input: {
        borderColor: "#ccc",
        borderWidth: 1,
        padding: 12,
        borderRadius: 8,
        height: 100,
        textAlignVertical: "top",
        marginBottom: 16,
    },
    button: {
        marginBottom: 24,
    },
    noReviews: {
        fontStyle: "italic",
        textAlign: "center",
        color: "#666",
    },
    reviewCard: {
        marginBottom: 12,
        backgroundColor: "#f9f9f9",
    },
    reviewer: {
        fontWeight: "bold",
        marginBottom: 4,
    }, reviewHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    reviewAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#ccc",
    },
    comment: {
        fontSize: 14,
        color: "#333",
        marginBottom: 8,
    },
    replyBox: {
        backgroundColor: "#eef6ff",
        padding: 8,
        borderRadius: 6,
    },
    replyLabel: {
        fontWeight: "600",
        color: "#1e88e5",
    },
    replyText: {
        color: "#333",
        fontSize: 14,
    },

});


export default Review;
