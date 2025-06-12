
// import {
//   collection,
//   addDoc,
//   serverTimestamp,
//   query,
//   orderBy,
//   onSnapshot
// } from "firebase/firestore";
// import { db } from "./config";

// const messagesRef = collection(db, "messages");

// export const sendMessage = async (text, userId) => {
//   await addDoc(messagesRef, {
//     text,
//     userId,
//     createdAt: serverTimestamp(),
//   });
// };

// export const subscribeToMessages = (callback) => {
//   const q = query(messagesRef, orderBy("createdAt", "asc"));
//   return onSnapshot(q, (snapshot) => {
//     const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//     callback(messages);
//   });
// };