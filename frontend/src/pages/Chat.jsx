import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Trash2, Copy, Check, MessageSquare } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';

const suggestedQuestions = [
  'Explain the concept of backpropagation',
  'What are the differences between supervised and unsupervised learning?',
  'Generate a study guide for neural networks',
  'Summarize the key points of machine learning',
];

export function Chat() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content:
        "Hello! I'm your AI learning assistant. I can help you understand your course materials, generate study guides, and answer questions. What would you like to learn about today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `I understand you're asking about "${userMessage.content}". Based on your course materials, here's what I found:\n\nThis is a simulated response. In the actual implementation, this would connect to your RAG-powered backend to provide contextual answers based on your uploaded course materials.\n\nWould you like me to explain any specific aspect in more detail?`,
      };
      setMessages((prev) => [...prev, aiMessage]);
      setLoading(false);
    }, 1500);
  };

  const handleSuggestionClick = (question) => {
    setInput(question);
    inputRef.current?.focus();
  };

  const handleCopy = async (content, id) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        id: Date.now(),
        role: 'assistant',
        content:
          "Chat cleared! I'm ready to help you with your course materials. What would you like to learn about?",
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-primary/30">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground">AI Chat Assistant</h1>
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="w-3 h-3" />
                AI Powered
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">Ask questions about your course materials</p>
          </div>
        </div>
        <Button variant="outline" size="sm" icon={Trash2} onClick={clearChat}>
          Clear Chat
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-4 animate-fade-in",
              message.role === 'user' && 'flex-row-reverse'
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg",
                message.role === 'user'
                  ? 'bg-gradient-to-br from-primary to-blue-600'
                  : 'bg-gradient-to-br from-violet-500 to-purple-600'
              )}
            >
              {message.role === 'user' ? (
                <User className="w-5 h-5 text-white" />
              ) : (
                <Bot className="w-5 h-5 text-white" />
              )}
            </div>

            {/* Message Content */}
            <div
              className={cn(
                "group relative max-w-[75%] px-4 py-3 rounded-2xl",
                message.role === 'user'
                  ? 'bg-gradient-to-r from-primary to-blue-600 text-white rounded-tr-sm'
                  : 'bg-card border border-border text-foreground rounded-tl-sm shadow-sm'
              )}
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
              
              {/* Copy Button */}
              {message.role === 'assistant' && (
                <button
                  onClick={() => handleCopy(message.content, message.id)}
                  className="absolute -right-10 top-2 p-1.5 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-muted"
                >
                  {copiedId === message.id ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex gap-4 animate-fade-in">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-xs text-muted-foreground ml-2">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <Card className="border-dashed mb-4">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground mb-3">✨ Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question) => (
                <button
                  key={question}
                  onClick={() => handleSuggestionClick(question)}
                  className="px-4 py-2 text-sm text-foreground bg-secondary hover:bg-secondary/80 rounded-full transition-all hover:scale-105"
                >
                  {question}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Input Form */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-3 pt-4 border-t border-border"
      >
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about your course materials..."
            className="w-full px-5 py-3.5 pr-14 border border-input rounded-2xl bg-background focus:border-primary focus:ring-2 focus:ring-ring focus:outline-none transition-all text-sm"
            disabled={loading}
          />
          <kbd className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center px-2 py-1 text-xs text-muted-foreground bg-muted rounded-md border border-border">
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
      </form>
    </div>
  );
}

export default Chat;
