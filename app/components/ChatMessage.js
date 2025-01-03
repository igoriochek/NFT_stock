
import React from 'react';
import classNames from 'classnames';

const ChatMessage = ({ message, isCurrentUser }) => (
  <div className={classNames("flex mb-4", { "justify-end": isCurrentUser })}>
    <div
      className={`p-3 rounded-lg max-w-xs ${
        isCurrentUser ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
      }`}
    >
      <p>{message.text}</p>
      <span className="text-xs text-gray-400">{new Date(message.createdAt).toLocaleTimeString()}</span>
    </div>
  </div>
);

export default ChatMessage;
