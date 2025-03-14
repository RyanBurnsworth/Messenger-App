import { useState, useEffect, useRef } from "react";
import InputMessageForm from "./InputMessageForm";
import Message from "./Message";
import MessageProps from "../props/MessageProps";
import supabase from "../client/supabaseClient";
import { v4 as uuidv4 } from "uuid";
import { ChatModel } from "../models/ChatModel";

const ChatContainer = () => {
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(true);
  const [name, setName] = useState("");

  // Store default chatroom data
  const chatModelRef = useRef<ChatModel>({
    id: 0,
    user1: "",
    username1: "",
    user2: "",
    username2: "",
    currentUserId: "",
    currentUserName: "",
  });

  const [userId, setUserId] = useState<string>(() => {
    return localStorage.getItem("userId") || uuidv4();
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const channelRef = useRef<any>(null);

  // Function to subscribe to messages from Supabase
  const listenForMessages = () => {
    const channel = supabase
      .channel("messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "Messages" }, (payload) => {
        console.log("Payload: ", payload);

        // Don't continue if the sender is the current user or if the chatroom numbers aren't equal
        if (payload.new.senderId === chatModelRef.current.currentUserId || chatModelRef.current.id !== payload.new.chatroomId) {
          return;
        }

        const incomingMessage: MessageProps = {
          text: payload.new.message,
          isSender: false,
          senderName: payload.new.senderName,
          timestamp: new Date().toLocaleTimeString(),
          avatar: "https://randomuser.me/api/portraits/women/2.jpg",
        };

        setMessages((prev) => [...prev, incomingMessage]);
      })
      .subscribe();

    // Store the channel reference for cleanup on unmount
    channelRef.current = channel;
  };

  // Function to subscribe to Chatroom updates
  const listenForChatroomUpdates = (userId: string) => {
    const channel = supabase
      .channel("chatrooms")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "Chatrooms" }, (payload) => {
        console.log("Payload captured for Chatroom Update: ", payload.new);

        if (payload.new.user2 === userId) {
          console.log("Joined chat with: ", payload.new.username1);
        } else if (payload.new.user2 !== "") {
          console.log(payload.new.username2, " joined the chat");
        }

        chatModelRef.current = {
          id: payload.new.id,
          user1: payload.new.user1,
          username1: payload.new.username1,
          user2: userId,
          username2: payload.new.username2,
          currentUserId: userId,
          currentUserName: chatModelRef.current.currentUserName,
        };
        console.log("ChatModel Updated: ", chatModelRef);
      })
      .subscribe();

    // Store the channel reference for cleanup on unmount
    channelRef.current = channel;
  };

  // Call this inside useEffect, passing the userId
  useEffect(() => {
    if (userId) {
      listenForChatroomUpdates(userId);
    }

    return () => {
      if (channelRef.current) {
        console.log("Left the chatroom");
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [userId]);

  useEffect(() => {
    listenForMessages();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Store userId in localStorage to persist across sessions
    localStorage.setItem("userId", userId);
  }, [userId]);

  // Function to handle sending a new message
  const handleSendMessage = (message: string) => {
    const senderName = chatModelRef.current.currentUserName || "user"; // Use entered name or default "user"
    const newMessage: MessageProps = {
      text: message,
      isSender: true,
      senderName: senderName,
      timestamp: new Date().toLocaleTimeString(),
      avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    };

    fetch("http://localhost:5405/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        senderId: chatModelRef.current.currentUserId,
        senderName: senderName,
        chatroomId: chatModelRef.current.id,
        message: message,
        created_at: new Date().toISOString(),
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

  // Handle name submission
  const handleNameSubmit = async () => {
    if (!name) return; // Prevent empty names

    try {
      const response = await fetch("http://localhost:5405/chatroom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          username: name,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to register user");
      }

      // Update the chat model
      chatModelRef.current.currentUserName = name;
      chatModelRef.current.currentUserId = userId;

      console.log("User registered successfully");
      setIsDialogOpen(false); // Close the dialog
    } catch (error) {
      console.error("Error registering user:", error);
    }
  };

  // Scroll to the bottom of the chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-screen w-screen flex flex-col">
      {/* Dialog Modal */}
      {isDialogOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80">
            <h2 className="text-xl font-bold mb-2">Welcome to Chat!</h2>
            <p className="mb-4">Please enter your name to continue:</p>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            />
            <button
              className={`px-4 py-2 rounded text-white ${
                name ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-400 cursor-not-allowed"
              }`}
              onClick={handleNameSubmit}
              disabled={!name} // Button disabled until name is entered
            >
              Continue
            </button>
          </div>
        </div>
      )}

      <div className="flex-grow overflow-y-auto p-4 bg-gray-100 border-b-2 border-gray-300">
        {messages.map((msg, index) => (
          <Message
            key={index}
            text={msg.text}
            isSender={msg.isSender}
            senderName={msg.senderName}
            timestamp={msg.timestamp}
            avatar={msg.avatar}
          />
        ))}

        <div ref={messagesEndRef} />
      </div>

      <InputMessageForm onMessageSubmitted={handleSendMessage} />
    </div>
  );
};

export default ChatContainer;
