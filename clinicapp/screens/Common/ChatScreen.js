import { FlatList, StyleSheet, View, Text, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MessageBubble from "../../components/MessageBubble";
import Header from "../../components/Header";
import { useEffect, useState } from "react";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TextInput } from "react-native-paper";
import { useRoute } from "@react-navigation/native";

const ChatScreen = () => {
  const route = useRoute();
  const [messages, setMessages] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [message, setMessage] = useState('');
  const [token, setToken] = useState("");
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
    form.append("content", message);
    form.append('receiver', selectedUser.id);
    console.log(form);
    let res = await authApis(token).post(endpoints['messages'], form, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    setMessage("");
    loadMessage();
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

        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.fileButton}>
            <Text style={styles.buttonText}>📎</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            placeholder="Nhập tin nhắn..."
            value={message}
            onChangeText={setMessage}
            mode="outlined"
          />

          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Text style={styles.buttonText}>📤</Text>
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
});

export default ChatScreen;