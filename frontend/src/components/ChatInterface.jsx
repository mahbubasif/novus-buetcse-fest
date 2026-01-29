import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, Copy, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

export function ChatInterface({ onSendMessage, messages = [], loading = false }) {
  const [input, setInput] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    
    onSendMessage?.(input.trim());
    setInput('');
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const suggestedPrompts = [
    "Explain the concept of...",
    "How does this work?",
    "Give me an example of...",
    "What are the key points?"
  ];

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-muted/20">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3B82F6]/20 to-[#60A5FA]/20 flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Start a Conversation</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Ask me anything about your course materials. I'm here to help you understand complex concepts.
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setInput(prompt)}
                  className="px-3 py-1.5 bg-secondary text-secondary-foreground text-sm rounded-full hover:bg-secondary/80 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              "flex gap-4 animate-fade-in",
              message.role === 'user' ? 'flex-row-reverse' : ''
            )}
          >
            <div
              className={cn(
                "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg",
                message.role === 'user'
                  ? 'bg-gradient-to-br from-primary to-blue-600'
                  : 'bg-gradient-to-br from-[#3B82F6] to-[#60A5FA]'
              )}
            >
              {message.role === 'user' ? (
                <User className="w-5 h-5 text-white" />
              ) : (
                <Bot className="w-5 h-5 text-white" />
              )}
            </div>
            <div className={cn(
              "group relative max-w-[75%]",
              message.role === 'user' ? 'items-end' : 'items-start'
            )}>
              <div
                className={cn(
                  "px-4 py-3 rounded-2xl shadow-sm",
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-primary to-blue-600 text-white rounded-tr-sm'
                    : 'bg-card border border-border text-foreground rounded-tl-sm'
                )}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>
              {message.role === 'assistant' && (
                <button
                  onClick={() => copyToClipboard(message.content, index)}
                  className="absolute -right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-muted hover:bg-muted/80"
                >
                  {copiedIndex === index ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </button>
              )}
              <span className={cn(
                "text-xs text-muted-foreground mt-1 block",
                message.role === 'user' ? 'text-right' : 'text-left'
              )}>
                {message.role === 'user' ? 'You' : 'AI Assistant'}
              </span>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex gap-4 animate-fade-in">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] flex items-center justify-center shadow-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-muted-foreground">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-background/80 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about your course materials..."
                className="w-full px-5 py-3.5 pr-14 border border-input rounded-2xl bg-background focus:border-primary focus:ring-2 focus:ring-ring focus:outline-none transition-all text-sm shadow-sm"
                disabled={loading}
              />
              <kbd className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center px-2 py-1 text-xs text-muted-foreground bg-muted rounded-md">
                ↵
              </kbd>
            </div>
            <Button 
              type="submit" 
              disabled={loading || !input.trim()} 
              size="lg"
              variant={input.trim() ? 'gradient' : 'secondary'}
              className="rounded-xl h-12 px-6"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Send</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChatInterface;
