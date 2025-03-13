import { useState, useEffect, useRef } from "react";
import InputMessageForm from "./InputMessageForm";
import Message from "./Message";
import MessageProps from "../interfaces/MessageProps";
import supabase from "../client/supabaseClient";

export default function ChatContainer() {
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const channelRef = useRef<any>(null);

  // Function to subscribe to messages from Supabase
  const listenForMessages = () => {
    // Subscribe to messages on the 'Messages' table in Supabase
    const channel = supabase
      .channel('messages') // Use channel method for real-time subscriptions
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Messages' }, (payload) => {
        console.log('Payload: ', payload);
        
        const incomingMessage: MessageProps = {
          text: payload.new.message,
          sender: payload.new.sender,
          timestamp: new Date().toLocaleTimeString(),
          avatar: "https://randomuser.me/api/portraits/women/2.jpg"
        };

        setMessages((prev) => [...prev, incomingMessage]);
      })
      .subscribe();

    // Store the channel reference for cleanup on unmount
    channelRef.current = channel;
  };

  useEffect(() => {
    listenForMessages();

    // Cleanup the subscription when the component unmounts
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  // Function to handle sending a new message
  const handleSendMessage = (message: string) => {
    const newMessage: MessageProps = {
      text: message,
      sender: "user",
      timestamp: new Date().toLocaleTimeString(),
      avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    };

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

      <InputMessageForm onMessageSubmitted={handleSendMessage} />
    </div>
  );
}
