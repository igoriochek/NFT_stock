'use client';
import { createContext, useContext, useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, onSnapshot, updateDoc, addDoc, doc } from "firebase/firestore";

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState(null); // Store current user ID

  // Load notifications for the logged-in user
  const loadNotifications = (userId) => {
    if (!userId) return; // Exit if no user ID

    const notificationsRef = collection(db, "notifications", userId, "userNotifications");
    const q = query(notificationsRef);

    return onSnapshot(q, (snapshot) => {
      const fetchedNotifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedNotifications.filter((n) => !n.read).length);
    });
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    if (!userId) return;
    const notificationRef = doc(db, "notifications", userId, "userNotifications", notificationId);
    await updateDoc(notificationRef, { read: true });
  };

  // Automatically load notifications when the user ID is set
  useEffect(() => {
    if (userId) {
      return loadNotifications(userId); // Set up real-time listener
    }
  }, [userId]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        setUserId, // Expose a function to set the user ID
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};