import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { endpoints } from "../configs/Apis";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [count, setCount] = useState(0);

  const loadNotificationCount = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await Apis.get(endpoints["notifications"], {
        headers: { Authorization: `Bearer ${token}` },
      });
      const unreadCount = res.data.filter(n => !n.is_read).length;
      setCount(unreadCount);
      console.log("Gọi API đếm thông báo...");
      console.log("Token:", token);
      console.log("Kết quả:", unreadCount);
    } catch (err) {
      console.error("Lỗi khi load thông báo:", err);
    }
  };

  useEffect(() => {
    const fetch = async () => {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        await loadNotificationCount();
      }
    };
    fetch();
  }, []);

  return (
    <NotificationContext.Provider value={{ count, setCount, loadNotificationCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
