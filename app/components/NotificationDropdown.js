import { useNotifications } from "../context/NotificationContext";
import { useState } from "react";
import { motion } from "framer-motion";

const NotificationDropdown = () => {
  const { notifications, markAsRead } = useNotifications();
  const [activeTab, setActiveTab] = useState("unread"); // "unread" or "all"
  const [visibleCount, setVisibleCount] = useState(5); // Limit initial view

  const filteredNotifications =
    activeTab === "unread"
      ? notifications.filter((notification) => !notification.read)
      : notifications;

  const handleNotificationClick = async (id, link) => {
    await markAsRead(id); // Mark as read
    window.location.href = link; // Navigate
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 5); // Increase visible notifications
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute right-0 mt-2 w-72 max-h-80 overflow-y-auto bg-gray-800 text-white shadow-lg rounded-lg py-4 custom-scrollbar"
    >
      <h2 className="text-lg font-semibold px-4">Notifications</h2>

      <div className="flex justify-between px-4 py-2 border-b border-gray-700">
        <button
          onClick={() => setActiveTab("unread")}
          className={`text-sm px-4 py-2 rounded-md transition-all duration-300 ${
            activeTab === "unread"
              ? "font-bold text-white bg-gray-900 pointer-events-none"
              : "text-white bg-gray-700 hover:bg-gray-900"
          }`}
        >
          Unread
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`text-sm px-4 py-2 rounded-md transition-all duration-300 ${
            activeTab === "all"
              ? "font-bold text-white bg-gray-900 pointer-events-none"
              : "text-white bg-gray-700 hover:bg-gray-900"
          }`}
        >
          All
        </button>
      </div>

      <ul className="mt-2 px-4 space-y-2">
        {filteredNotifications.length === 0 ? (
          <li className="text-center text-gray-400">No Notifications</li>
        ) : (
          filteredNotifications.slice(0, visibleCount).map((notification) => (
            <li
              key={notification.id}
              onClick={() =>
                handleNotificationClick(notification.id, notification.link)
              }
              className={`p-2 rounded-md cursor-pointer hover:bg-gray-700 transition-all duration-300 flex items-center space-x-2 ${
                notification.read ? "text-gray-400" : "font-bold"
              }`}
            >
              <span className="text-xl">{notification.icon}</span>
              <span>{notification.message}</span>
            </li>
          ))
        )}
      </ul>

      {visibleCount < filteredNotifications.length && (
        <div className="px-4 py-2 text-center">
          <button
            onClick={handleLoadMore}
            className="text-sm text-white bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-md transition-all duration-300"
          >
            Load More
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default NotificationDropdown;