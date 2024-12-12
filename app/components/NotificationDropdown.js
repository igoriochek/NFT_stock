import { useNotifications } from "../context/NotificationContext";
import { useState } from "react";
import { motion } from "framer-motion";

const NotificationDropdown = () => {
  const { notifications, markAsRead } = useNotifications();
  const [activeTab, setActiveTab] = useState("unread"); // "unread" or "all"

  const filteredNotifications =
    activeTab === "unread"
      ? notifications.filter((notification) => !notification.read)
      : notifications;

  const handleMarkAsRead = async (id) => {
    await markAsRead(id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute right-0 mt-2 w-72 bg-gray-800 text-white shadow-lg rounded-lg py-4 group-hover:block"
      onMouseEnter={(e) => e.stopPropagation()}
      onMouseLeave={(e) => e.stopPropagation()}
    >
      <h2 className="text-lg font-semibold px-4">Notifications</h2>
      <div className="flex justify-between px-4 py-2 border-b border-gray-700">
        <button
          onClick={() => setActiveTab("unread")}
          className={`text-sm ${
            activeTab === "unread" ? "font-bold text-white" : "text-white"
          }`}
        >
          Unread
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`text-sm ${
            activeTab === "all" ? "font-bold text-white" : "text-white"
          }`}
        >
          All
        </button>
      </div>
      <ul className="mt-2 px-4 space-y-2">
        {filteredNotifications.length === 0 ? (
          <li className="text-center text-white">No Notifications</li>
        ) : (
          filteredNotifications.map((notification) => (
            <li
              key={notification.id}
              className={`p-2 rounded-md flex justify-between items-center hover:bg-gray-700 transition-all duration-300 ${
                notification.read ? "bg-gray-700" : "bg-gray-600"
              }`}
            >
              <a href={notification.link} className="cursor-pointer">
                {notification.message}
              </a>
              {!notification.read && (
                <button
                  onClick={() => handleMarkAsRead(notification.id)}
                  className="text-sm text-white hover:text-white hover:font-bold"
                >
                  Mark as Read
                </button>
              )}
            </li>
          ))
        )}
      </ul>
    </motion.div>
  );
};

export default NotificationDropdown;