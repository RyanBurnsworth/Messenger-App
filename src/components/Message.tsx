import MessageProps from "../props/MessageProps";

export default function Message({
  text,
  isSender,
  senderName,
  timestamp,
  avatar,
}: MessageProps) {
  return (
    <div className={`flex flex-col ${isSender ? "items-end" : "items-start"}`}>
      <span className="text-xs text-gray-500 mb-1">{timestamp}</span>

      <div
        className={`flex items-center gap-2 p-3 max-w-xs rounded-lg shadow-md ${
          isSender ? "bg-fuchsia-500 text-white" : "bg-gray-300 text-black"
        }`}
      >
        <img
          src={avatar}
          alt="User Avatar"
          className="w-8 h-8 rounded-full border-2 border-white"
        />

        <div>
          <strong>{senderName}: </strong>
          <span>{text}</span>
        </div>
      </div>
    </div>
  );
}
