import React, { useState, useRef, useEffect } from 'react';
import { Send, ImagePlus, X, Loader2, Mic } from 'lucide-react';
import { SUPPORTED_IMAGE_TYPES } from '../types';

interface InputAreaProps {
  onSendMessage: (text: string, image?: string, mimeType?: string) => void;
  isLoading: boolean;
}

// Extend window interface for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      alert('Please upload a valid image (JPEG, PNG, WEBP, HEIC).');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setImageMimeType(file.type);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageMimeType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setText((prev) => (prev ? prev + ' ' : '') + transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSubmit = () => {
    if ((!text.trim() && !imagePreview) || isLoading) return;

    onSendMessage(text, imagePreview || undefined, imageMimeType || undefined);
    
    setText('');
    clearImage();
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 pb-6 z-50 transition-all duration-200">
      <div className="max-w-3xl mx-auto flex flex-col gap-3">
        
        {/* Image Preview */}
        {imagePreview && (
          <div className="relative inline-block w-fit animate-in fade-in slide-in-from-bottom-2">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="h-20 rounded-lg border border-slate-200 shadow-sm" 
            />
            <button 
              onClick={clearImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-md"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="flex items-end gap-3">
          {/* File Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors flex-shrink-0"
            title="Upload image"
            disabled={isLoading}
          >
            <ImagePlus size={24} />
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </button>

          {/* Voice Input Button */}
          <button
            onClick={toggleListening}
            className={`p-3 rounded-xl transition-all flex-shrink-0 ${
              isListening
                ? 'bg-red-50 text-red-600 animate-pulse ring-2 ring-red-100'
                : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'
            }`}
            title={isListening ? "Stop recording" : "Use voice input"}
            disabled={isLoading}
          >
            <Mic size={24} className={isListening ? "animate-bounce" : ""} />
          </button>

          {/* Text Input */}
          <div className="flex-1 bg-slate-100 rounded-2xl border-transparent focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent border transition-all">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Listening..." : "Ask a question or describe the problem..."}
              className="w-full bg-transparent border-none focus:ring-0 resize-none py-3 px-4 max-h-32 text-slate-800 placeholder:text-slate-400"
              rows={1}
              disabled={isLoading}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSubmit}
            disabled={(!text.trim() && !imagePreview) || isLoading}
            className={`p-3 rounded-xl flex-shrink-0 transition-all duration-200 ${
              (!text.trim() && !imagePreview) || isLoading
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 hover:scale-105 active:scale-95'
            }`}
          >
            {isLoading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
          </button>
        </div>
        <div className="text-center text-xs text-slate-400">
          AI Tutor can make mistakes. Double check important calculations.
        </div>
      </div>
    </div>
  );
};

export default InputArea;