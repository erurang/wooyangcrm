"use client";

interface SimpleToastProps {
  message: string;
  onClose: () => void;
}

export default function SimpleToast({ message, onClose }: SimpleToastProps) {
  if (!message) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-md">
      {message}
      <button className="ml-2 text-sm" onClick={onClose}>
        닫기
      </button>
    </div>
  );
}
