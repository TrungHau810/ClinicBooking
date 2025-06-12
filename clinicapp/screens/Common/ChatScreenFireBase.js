// import React, { useEffect, useState } from "react";
// import { View, TextInput, Button, FlatList, Text } from "react-native";
// import { sendMessage, subscribeToMessages } from "../../firebase/ChatService";

// export default function ChatBox({ userId }) {
//   const [input, setInput] = useState("");
//   const [messages, setMessages] = useState([]);

//   useEffect(() => {
//     const unsubscribe = subscribeToMessages(setMessages);
//     return () => unsubscribe();
//   }, []);

//   const handleSend = () => {
//     if (input.trim()) {
//       sendMessage(input, userId);
//       setInput("");
//     }
//   };

//   return (
//     <View style={{ flex: 1, padding: 16 }}>
//       <FlatList
//         data={messages}
//         keyExtractor={item => item.id}
//         renderItem={({ item }) => (
//           <Text>{item.userId}: {item.text}</Text>
//         )}
//       />
//       <TextInput
//         value={input}
//         onChangeText={setInput}
//         placeholder="Nhập tin nhắn..."
//         style={{ borderWidth: 1, marginBottom: 8, padding: 8 }}
//       />
//       <Button title="Gửi" onPress={handleSend} />
//     </View>
//   );
// }