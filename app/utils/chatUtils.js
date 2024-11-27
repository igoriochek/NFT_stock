// Location: utils/chatUtils.js

import { db } from '../firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export const createOrGetChat = async (user1, user2) => {
  const users = [user1, user2].sort(); // Consistent ID
  const chatId = `${users[0]}_${users[1]}`;
  const chatDoc = doc(db, 'chats', chatId);

  // Check if the chat exists
  const docSnapshot = await getDoc(chatDoc);
  if (!docSnapshot.exists()) {
    await setDoc(chatDoc, { user1: users[0], user2: users[1], createdAt: serverTimestamp() });
  }
  return chatId;
};
