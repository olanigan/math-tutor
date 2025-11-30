import React, { useState, useEffect, useRef } from 'react';
import { startNewSession, sendMessageStream } from './services/geminiService';
import { Message } from './types';
import MessageBubble from './components/MessageBubble';
import InputArea from './components/InputArea';
import { Calculator, Eraser, BrainCircuit } from 'lucide-react';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize chat on mount
  useEffect(() => {
    startNewSession();
    // Add an initial greeting from the AI
    const initialGreeting: Message = {
      id: 'init-1',
      role: 'model',
      text: "Hello! I'm your Socratic Math Tutor. \n\nI'm here to help you understand math, not just solve it. Upload a photo of a problem or type it out, and we can walk through it together step-by-step.",
      timestamp: Date.now()
    };
    setMessages([initialGreeting]);
  }, []);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleNewSession = () => {
    if (window.confirm("Start a new session? Current history will be cleared.")) {
      startNewSession();
      setMessages([{
        id: `init-${Date.now()}`,
        role: 'model',
        text: "Session cleared. What problem shall we tackle next?",
        timestamp: Date.now()
      }]);
    }
  };

  const handleSendMessage = async (text: string, image?: string, mimeType?: string) => {
    const userMsgId = Date.now().toString();
    const newUserMessage: Message = {
      id: userMsgId,
      role: 'user',
      text: text,
      image: image,
      timestamp: Date.now(),
    };

    // Add user message
    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    // Create placeholder for bot response
    const botMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: botMsgId,
        role: 'model',
        text: '',
        isThinking: true, // Show thinking indicator initially
        timestamp: Date.now(),
      },
    ]);

    try {
      const stream = sendMessageStream(text, image, mimeType);
      let accumulatedText = '';
      let firstChunkReceived = false;

      for await (const chunk of stream) {
        accumulatedText += chunk;
        
        // Once we receive the first chunk, we are mostly done "thinking" (waiting for initial token)
        // although technically the model thinks before outputting.
        if (!firstChunkReceived && chunk) {
            firstChunkReceived = true;
        }

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMsgId
              ? { ...msg, text: accumulatedText, isThinking: false } // Remove thinking indicator as text streams in
              : msg
          )
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMsgId
            ? { ...msg, text: "I'm sorry, I encountered an error while analyzing that. Please try again.", isThinking: false }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
              <Calculator size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-800 leading-tight">Socratic Math Tutor</h1>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <BrainCircuit size={12} />
                <span>Thinking Model Active</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleNewSession}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
            title="Start New Session"
          >
            <Eraser size={18} />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 pb-32 scroll-smooth">
        <div className="max-w-3xl mx-auto">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <InputArea onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default App;