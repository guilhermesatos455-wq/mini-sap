import React, { useState, useMemo } from 'react';
import ReactWebChat, { createDirectLine } from 'botframework-webchat';
import { MessageSquare, X } from 'lucide-react';

const ChatBubble: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const directLine = useMemo(() => {
    const secret = import.meta.env.VITE_BOT_DIRECT_LINE_SECRET;
    if (!secret) {
      console.warn("VITE_BOT_DIRECT_LINE_SECRET is not set");
      return null;
    }
    return createDirectLine({ secret });
  }, []);

  if (!directLine) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="fixed bottom-20 right-4 w-[350px] h-[500px] shadow-2xl rounded-xl overflow-hidden bg-white border border-gray-200">
          <div className="bg-[#8DC63F] text-white p-3 flex justify-between items-center">
            <h2 className="font-bold text-sm">Suporte Técnico</h2>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded">
              <X size={18} />
            </button>
          </div>
          <div className="h-[calc(100%-48px)]">
            <ReactWebChat directLine={directLine} userID="my-user-id" />
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-[#8DC63F] text-white p-4 rounded-full shadow-lg hover:bg-[#7ab035] transition-all"
        >
          <MessageSquare size={24} />
        </button>
      )}
    </div>
  );
};

export default ChatBubble;
