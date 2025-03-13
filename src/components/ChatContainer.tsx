import { useState, useEffect, useRef } from "react";
import InputMessageForm from "./InputMessageForm";
import Message from "./Message";
import MessageProps from "../interfaces/MessageProps";

export default function ChatContainer() {
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const handleSendMessage = (message: string) => {
    const newMessage: MessageProps = {
      text: message,
      sender: "user",
      timestamp: new Date().toLocaleTimeString(),
      avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    };

    setMessages((prev) => [...prev, newMessage]);

    // Simulate a response from the other user
    setTimeout(() => {
      const responseMessage: MessageProps = {
        text: `Reply to: ${message}`,
        sender: "other",
        timestamp: new Date().toLocaleTimeString(),
        avatar: "https://randomuser.me/api/portraits/women/2.jpg",
      };

      setMessages((prev) => [...prev, responseMessage]);
    }, 1000);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-screen w-screen flex flex-col">
      <div className="flex-grow overflow-y-auto p-4 bg-gray-100 border-b-2 border-gray-300">
        {messages.map((msg, index) => (
          <Message
            key={index}
            text={msg.text}
            sender={msg.sender}
            timestamp={msg.timestamp}
            avatar={msg.avatar}
          />
        ))}

        <div ref={messagesEndRef} />
      </div>

      <InputMessageForm onMessageSubmitted={handleSendMessage} />
    </div>
  );
}
