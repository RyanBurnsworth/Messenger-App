import { useState, useEffect, useRef } from "react";
import InputMessageForm from "./InputMessageForm";
import Message from "./Message";
import MessageProps from "../interfaces/MessageProps";
import supabase from "../client/supabaseClient";

const ChatContainer = () => {
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const channelRef = useRef<any>(null);

  // Function to subscribe to messages from Supabase
  const listenForMessages = () => {
    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "Messages" },
        (payload) => {
          console.log("Payload: ", payload);

          const incomingMessage: MessageProps = {
            text: payload.new.message,
            sender: "other",
            timestamp: new Date().toLocaleTimeString(),
            avatar: "https://randomuser.me/api/portraits/women/2.jpg",
          };

          setMessages((prev) => [...prev, incomingMessage]);
        }
      )
      .subscribe();

    // Store the channel reference for cleanup on unmount
    channelRef.current = channel;
  };

  useEffect(() => {
    listenForMessages();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  // Function to handle sending a new message
  const handleSendMessage = (message: string, recipientName: string) => {
    const senderName = "user"; // Set the sender name
    const newMessage: MessageProps = {
      text: message,
      sender: senderName,
      timestamp: new Date().toLocaleTimeString(),
      avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    };

    fetch("http://localhost:5405/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: senderName,
        recipient: recipientName,
        message: message,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Message sent:", data);
      })
      .catch((error) => {
        console.error("Error sending message:", error);
      });

      setMessages((prev) => [...prev, newMessage]);
  };

  // Scroll to the bottom of the chat when messages change
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

      <InputMessageForm
        onMessageSubmitted={(message) =>
          handleSendMessage(message, "recipientName")
        }
      />
    </div>
  );
};

export default ChatContainer;
