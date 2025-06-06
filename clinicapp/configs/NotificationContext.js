import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { endpoints } from "../configs/Apis";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [count, setCount] = useState(0);

  const loadNotificationCount = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await Apis.get(endpoints["notification_count"], {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCount(res.data.count);
    } catch (err) {
      console.error("Lỗi khi load thông báo:", err);
    }
  };

  useEffect(() => {
    loadNotificationCount(); // tự gọi khi provider được mount
  }, []);

  return (
    <NotificationContext.Provider value={{ count, setCount, loadNotificationCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
