import { useState } from "react";

interface InputMessageFormProps {
  onMessageSubmitted: (message: string) => void;
}

export default function InputMessageForm({
  onMessageSubmitted,
}: InputMessageFormProps) {
  const [message, setMessage] = useState("");

  const handleMessageSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (message.trim() === "") return;
    onMessageSubmitted(message);
    setMessage("");
  };

  return (
    <div className="w-full border-2 border-fuchsia-800 p-2 rounded-lg">
      <form onSubmit={handleMessageSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-grow p-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-fuchsia-500"
          placeholder="Enter your message..."
        />
        <button className="bg-fuchsia-800 text-white px-4 py-2 rounded-lg hover:bg-fuchsia-700 transition">
          Send
        </button>
      </form>
    </div>
  );
}
