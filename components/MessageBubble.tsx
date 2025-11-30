import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types';
import { Bot, User, BrainCircuit } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
          isUser ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
        }`}>
          {isUser ? <User size={20} /> : <Bot size={20} />}
        </div>

        {/* Content Bubble */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-5 py-3.5 rounded-2xl shadow-sm overflow-hidden ${
            isUser 
              ? 'bg-indigo-600 text-white rounded-tr-none' 
              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
          }`}>
            
            {/* Image rendering */}
            {message.image && (
              <div className="mb-3">
                <img 
                  src={message.image} 
                  alt="User upload" 
                  className="max-w-full h-auto rounded-lg border border-white/20 max-h-64 object-contain" 
                />
              </div>
            )}

            {/* Thinking Indicator (for loading state specifically, handled via isLoading usually, but if we had explicit thinking parts) */}
            {message.isThinking && (
              <div className="flex items-center gap-2 text-slate-500 italic mb-2 animate-pulse">
                <BrainCircuit size={16} />
                <span className="text-sm">Thinking deeply...</span>
              </div>
            )}

            {/* Text Content */}
            <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : 'prose-slate'}`}>
              <ReactMarkdown>{message.text}</ReactMarkdown>
            </div>
          </div>
          
          {/* Timestamp */}
          <span className="text-xs text-slate-400 mt-1 px-1">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;