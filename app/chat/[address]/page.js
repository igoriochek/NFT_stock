"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  doc,
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  getDoc,
  setDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useMetaMask } from "@/app/context/MetaMaskContext";
import { getUserProfileByAddress } from "@/app/utils/firebaseUtils";

const ChatPage = ({ params }) => {
  const { address: targetAddress } = params;
  const { address: currentAddress } = useMetaMask();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [targetUserProfile, setTargetUserProfile] = useState({});
  const [isTypingOtherUser, setIsTypingOtherUser] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Helper function to ensure the chat document exists
  const ensureChatDocumentExists = async (chatId) => {
    const chatDocRef = doc(db, "chats", chatId);
    const chatDoc = await getDoc(chatDocRef);
  
    if (!chatDoc.exists()) {
      // Initialize the chat document with default fields
      await setDoc(
        chatDocRef,
        {
          typingStatus: { [currentAddress]: false, [targetAddress]: false },
          participants: [currentAddress, targetAddress], // Add participants for future reference
          createdAt: serverTimestamp(), // Add creation timestamp
        },
        { merge: true } // Merge if the document partially exists
      );
    }
  };
  

  useEffect(() => {
    if (!targetAddress) return;

    const fetchTargetUserProfile = async () => {
      const profile = await getUserProfileByAddress(targetAddress);
      setTargetUserProfile(profile || {});
    };

    fetchTargetUserProfile();
  }, [targetAddress]);

  useEffect(() => {
    if (!currentAddress || !targetAddress) return;

    const chatId =
      currentAddress < targetAddress
        ? `${currentAddress}_${targetAddress}`
        : `${targetAddress}_${currentAddress}`;

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(messagesData);
    });

    return () => unsubscribe();
  }, [currentAddress, targetAddress]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
  
    const chatId =
      currentAddress < targetAddress
        ? `${currentAddress}_${targetAddress}`
        : `${targetAddress}_${currentAddress}`;
  
    try {
      await ensureChatDocumentExists(chatId); // Ensure the chat document exists
  
      // Add the new message
      await addDoc(collection(db, "chats", chatId, "messages"), {
        sender: currentAddress,
        message: newMessage.trim(),
        timestamp: serverTimestamp(),
        seen: false,
      });
  
      // Reset the message input and update typing status
      setNewMessage("");
      await updateDoc(doc(db, "chats", chatId), {
        [`typingStatus.${currentAddress}`]: false,
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
  

  const handleTyping = async (e) => {
    const messageText = e.target.value;
    setNewMessage(messageText);
  
    const chatId =
      currentAddress < targetAddress
        ? `${currentAddress}_${targetAddress}`
        : `${targetAddress}_${currentAddress}`;
  
    // Ensure the chat document exists
    await ensureChatDocumentExists(chatId);
  
    if (messageText.trim() === "") {
      clearTimeout(typingTimeoutRef.current);
      await updateDoc(doc(db, "chats", chatId), {
        [`typingStatus.${currentAddress}`]: false,
      });
    } else {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      await updateDoc(doc(db, "chats", chatId), {
        [`typingStatus.${currentAddress}`]: true,
      });
  
      typingTimeoutRef.current = setTimeout(async () => {
        await updateDoc(doc(db, "chats", chatId), {
          [`typingStatus.${currentAddress}`]: false,
        });
      }, 3000);
    }
  };
  

  const handleBlur = async () => {
    if (newMessage.trim() === "") {
      const chatId =
        currentAddress < targetAddress
          ? `${currentAddress}_${targetAddress}`
          : `${targetAddress}_${currentAddress}`;
      await updateDoc(doc(db, "chats", chatId), { [`typingStatus.${currentAddress}`]: false });
    }
  };

  useEffect(() => {
    if (!currentAddress || !targetAddress) return;

    const chatId =
      currentAddress < targetAddress
        ? `${currentAddress}_${targetAddress}`
        : `${targetAddress}_${currentAddress}`;

    const typingUnsub = onSnapshot(doc(db, "chats", chatId), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const typingStatus = docSnapshot.data().typingStatus || {};
        setIsTypingOtherUser(typingStatus[targetAddress]);
      }
    });

    return () => typingUnsub();
  }, [currentAddress, targetAddress]);

  return (
    <div className="container mx-auto p-6 bg-gray-100 h-full text-gray-800">
      <h2 className="text-2xl font-bold mb-4 text-blue-700">
        Chat with {targetUserProfile.username || "Anonymous"}
      </h2>
      <div className="bg-white p-4 rounded-lg shadow-md h-80 overflow-y-auto mb-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-2 my-2 rounded-md ${
              msg.sender === currentAddress
                ? "bg-blue-100 text-right"
                : "bg-gray-200 text-left"
            }`}
          >
            <p className="text-sm font-bold">
              {msg.sender === currentAddress
                ? "You"
                : targetUserProfile.username || "Anonymous"}
              <span className="ml-2 text-xs text-gray-500">
                {msg.timestamp
                  ? new Date(msg.timestamp.toDate()).toLocaleTimeString()
                  : "Sending..."}
              </span>
            </p>
            <p>{msg.message}</p>
            {msg.sender === currentAddress && (
              <span className="text-xs text-gray-500">
                {msg.seen ? "Seen" : "Sent"}
              </span>
            )}
          </div>
        ))}
        {isTypingOtherUser && (
          <p className="text-gray-500 text-sm italic">
            {targetUserProfile.username || "Anonymous"} is typing...
          </p>
        )}
      </div>
      <div className="flex items-center">
        <input
          type="text"
          value={newMessage}
          onChange={handleTyping}
          onBlur={handleBlur}
          placeholder="Type a message..."
          className="flex-grow border rounded-l-lg px-4 py-2 bg-gray-50 text-gray-700"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded-r-lg"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatPage;
