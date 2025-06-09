import { FlatList, StyleSheet, View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MessageBubble from "../../components/MessageBubble";
import Header from "../../components/Header";
import { useEffect, useState } from "react";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Icon, TextInput } from "react-native-paper";
import { useRoute } from "@react-navigation/native";
import * as ImagePicker from 'expo-image-picker';

const ChatScreen = () => {
  const route = useRoute();
  const [messages, setMessages] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [message, setMessage] = useState('');
  const [token, setToken] = useState("");
  const [imageToSend, setImageToSend] = useState(null);
  const { selectedUser } = route.params;

  const loadMessage = async () => {
    let token = await AsyncStorage.getItem("token");
    setToken(token);
    let user = await AsyncStorage.getItem("currentUser");
    user = JSON.parse(user);
    setCurrentUserId(user.id);

    let res = await authApis(token).get(`${endpoints['messages']}?participant_id=${selectedUser.id}`);
    setMessages(res.data);
  };

  const sendMessage = async () => {
    let form = new FormData();
    if (message.trim()) form.append("content", message);
    form.append("receiver", selectedUser.id);

    if (imageToSend) {
      form.append("image", {
        uri: Platform.OS === "android" ? imageToSend.uri : imageToSend.uri.replace("file://", ""),
        name: imageToSend.fileName || "photo.jpg",
        type: imageToSend.mimeType || "image/jpeg",
      });
    }

    try {
      await authApis(token).post(endpoints['messages'], form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage("");
      setImageToSend(null);
      loadMessage();
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", "Không thể gửi tin nhắn.");
    }
  };

  const pickImageAndSend = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Lỗi", "Cần cấp quyền để chọn ảnh");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled) {
      const selectedAsset = result.assets[0];
      console.log(selectedAsset);
      setImageToSend(selectedAsset); // Chỉ chọn ảnh, chưa gửi
    }
  };

  useEffect(() => {
    loadMessage();
    const interval = setInterval(() => {
      loadMessage(); // tải lại mỗi 3 giây
    }, 3000);

    return () => clearInterval(interval); // dọn dẹp khi unmount
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Header title={selectedUser.full_name || "Đang tải..."} />

      <KeyboardAvoidingView
        style={styles.flexContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={80}
      >
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <MessageBubble message={item} currentUserId={currentUserId} />
          )}
          contentContainerStyle={{ padding: 10, flexGrow: 1 }}
          style={{ flex: 1 }}
          ListEmptyComponent={() => (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text>Chưa có tin nhắn nào, hãy bắt đầu trò chuyện nhé!</Text>
            </View>
          )}
        />

        {imageToSend && (
          <View style={styles.previewContainer}>
            <Image
              source={{ uri: imageToSend.uri }}
              style={styles.previewImage}
            />
            <TouchableOpacity onPress={() => setImageToSend(null)}>
              <Text style={{ color: 'red', marginTop: 5 }}>Xoá ảnh</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.fileButton} onPress={pickImageAndSend}>
            <Icon source="paperclip" size={22} color="#000" />
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            placeholder="Nhập tin nhắn..."
            value={message}
            onChangeText={setMessage}
            mode="outlined"
          />

          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Text style={styles.buttonText}>
              <Icon source="send" size={25} color="#000" />
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  flexContainer: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  fileButton: {
    padding: 10,
  },
  textInput: {
    flex: 1,
    marginHorizontal: 5,
  },
  sendButton: {
    padding: 10,
  },
  buttonText: {
    fontSize: 20,
  },
  previewContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
});

export default ChatScreen;
