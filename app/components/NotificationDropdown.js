import { useNotifications } from "../context/NotificationContext";
import { useState } from "react";

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
    <div className="absolute right-0 mt-2 w-72 bg-white text-black shadow-lg rounded-lg p-4">
      <h2 className="text-lg font-semibold">Notifications</h2>
      <div className="flex justify-between border-b pb-2">
        <button
          onClick={() => setActiveTab("unread")}
          className={`text-sm ${
            activeTab === "unread" ? "font-bold" : "text-white"
          }`}
        >
          Unread
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`text-sm ${
            activeTab === "all" ? "font-bold" : "ttext-white"
          }`}
        >
          All
        </button>
      </div>
      <ul className="mt-2">
        {filteredNotifications.length === 0 ? (
          <li className="text-center text-white">No Notifications</li>
        ) : (
          filteredNotifications.map((notification) => (
            <li
              key={notification.id}
              className={`p-2 rounded-md flex justify-between items-center ${
                notification.read ? "bg-gray-200" : "bg-gray-100"
              }`}
            >
              <a href={notification.link} className="cursor-pointer">
                {notification.message}
              </a>
              {!notification.read && (
                <button
                  onClick={() => handleMarkAsRead(notification.id)}
                  className="text-white text-sm"
                >
                  Mark as Read
                </button>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default NotificationDropdown;
