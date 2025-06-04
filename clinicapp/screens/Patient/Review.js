import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Alert, Image } from "react-native";
import { Button, Card } from "react-native-paper";
import { useRoute } from "@react-navigation/native";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import StarRating from "react-native-star-rating-widget";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/Header";

const Review = () => {
    const route = useRoute();
    const { doctor } = route.params;
    const [reviews, setReviews] = useState([]);
    const [rating, setRating] = useState(0);
    const [content, setContent] = useState("");

    const loadReview = async () => {
        let res = await Apis.get(`${endpoints['reviews']}/${doctor}`);
    }

    const submitReview = async () => {
        // try {
        //     if (rating === 0 || !content.trim()) {
        //         Alert.alert("Lỗi", "Vui lòng nhập đủ thông tin đánh giá.");
        //         return;
        //     }

        //     await Apis.post(endpoints["doctor_reviews"](doctor), {
        //         rating,
        //         content,
        //     });

        //     Alert.alert("Thành công", "Cảm ơn bạn đã đánh giá!");
        // } catch (error) {
        //     console.error(error);
        //     Alert.alert("Lỗi", "Không thể gửi đánh giá. Vui lòng thử lại.");
        // }
    };

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
                                rating={doctor.average_rating}
                                starSize={20}
                                enableSwiping={false}
                                onChange={() => { }}
                            />
                            <Text style={styles.averageText}>{doctor.average_rating.toFixed(1)} / 5</Text>
                        </View>
                    </View>
                </Card.Content>
            </Card>


            <Text style={styles.subTitle}>Đánh giá của bạn</Text>

            <StarRating rating={rating} onChange={setRating} starSize={30} />

            <TextInput
                style={styles.input}
                placeholder="Nhập nhận xét của bạn..."
                multiline
                value={content}
                onChangeText={setContent}
            />

            <Button mode="contained" onPress={submitReview} style={styles.button}>
                Gửi đánh giá
            </Button>

            <Text style={styles.subTitle}>Các đánh giá trước đó</Text>

            {/* {reviews.length === 0 ? (
                <Text style={styles.noReviews}>Chưa có đánh giá nào.</Text>
            ) : (
                reviews.map((r, idx) => (
                    <Card key={idx} style={styles.reviewCard}>
                        <Card.Content>
                            <Text style={styles.reviewer}>{r.user.full_name}</Text>
                            <StarRating rating={r.rating} onChange={() => { }} starSize={20} enableSwiping={false} />
                            <Text>{r.content}</Text>
                        </Card.Content>
                    </Card>
                ))
            )} */}
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
    },
});


export default Review;
