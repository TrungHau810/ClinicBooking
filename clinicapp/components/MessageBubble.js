import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import ImageViewing from 'react-native-image-viewing';

const MessageBubble = ({ message, currentUserId }) => {
    const isSender = message.sender.id === currentUserId;
    const [visible, setVisible] = useState(false);

    const fullImageUrl = message.image?.startsWith("http")
        ? message.image
        : message.image
            ? `https://res.cloudinary.com/tthau2004/${message.image}`
            : null;

    return (
        <View style={[styles.messageRow, isSender ? styles.right : styles.left]}>
            {!isSender && (
                <Image source={{ uri: message.sender.avatar }} style={styles.avatar} />
            )}

            <View style={[styles.bubble, isSender ? styles.senderBubble : styles.receiverBubble]}>
                <Text style={styles.name}>{message.sender.full_name}</Text>

                {/* Nội dung văn bản nếu có */}
                {message.content ? (
                    <Text style={styles.text}>{message.content}</Text>
                ) : null}

                {/* Hình ảnh nếu có */}
                {fullImageUrl ? (
                    <>
                        <TouchableOpacity onPress={() => setVisible(true)}>
                            <Image
                                source={{ uri: fullImageUrl }}
                                style={styles.image}
                                onError={() => console.log("Lỗi khi tải ảnh")}
                            />
                        </TouchableOpacity>
                        <ImageViewing
                            images={[{ uri: fullImageUrl }]}
                            imageIndex={0}
                            visible={visible}
                            onRequestClose={() => setVisible(false)}
                        />
                    </>
                ) : null}

                <Text style={styles.time}>
                    {new Date(message.created_date).toLocaleString('vi-VN')}
                </Text>
            </View>

            {isSender && (
                <Image source={{ uri: message.sender.avatar }} style={styles.avatar} />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    messageRow: {
        flexDirection: 'row',
        marginVertical: 6,
        alignItems: 'flex-end',
    },
    left: {
        justifyContent: 'flex-start',
    },
    right: {
        justifyContent: 'flex-end',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginHorizontal: 8,
    },
    bubble: {
        maxWidth: '70%',
        padding: 10,
        borderRadius: 10,
    },
    senderBubble: {
        backgroundColor: '#daf1da',
        alignItems: 'flex-end',
    },
    receiverBubble: {
        backgroundColor: '#f1f1f1',
        alignItems: 'flex-start',
    },
    name: {
        fontWeight: 'bold',
        marginBottom: 4,
    },
    text: {
        fontSize: 16,
        lineHeight: 20,
    },
    time: {
        fontSize: 10,
        color: 'gray',
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    image: {
        width: 200,
        height: 200,
        borderRadius: 10,
        marginTop: 8,
    }
});

export default MessageBubble;
