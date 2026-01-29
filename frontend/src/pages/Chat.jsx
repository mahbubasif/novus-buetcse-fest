import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Trash2, Copy, Check, MessageSquare, BookOpen, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';
import { sendChatMessage, clearChatHistory, startNewConversation } from '../services/api';

const suggestedQuestions = [
  'Explain the concept of backpropagation',
  'What are the differences between supervised and unsupervised learning?',
  'Generate theory notes on neural networks',
  'Summarize machine learning fundamentals',
  'Search for materials about deep learning',
  'Create a lab exercise on data preprocessing',
];

export function Chat() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content:
        "Hello! I'm your AI learning assistant. I can help you:\n\n• **Search** course materials\n• **Explain** concepts from your materials\n• **Summarize** content\n• **Generate** theory notes or lab exercises\n\nWhat would you like to learn about today?",
      sources: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [error, setError] = useState(null);
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
    setError(null);

    try {
      const response = await sendChatMessage(userMessage.content, conversationId);
      
      if (response.success) {
        // Store conversation ID for follow-up messages
        if (response.conversationId) {
          setConversationId(response.conversationId);
        }

        const aiMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: response.message,
          sources: response.sources || [],
          intent: response.intent,
          hasContext: response.hasContext,
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        throw new Error(response.error || 'Failed to get response');
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to send message');
      // Add error message to chat
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err.response?.data?.error || err.message || 'Unknown error'}. Please try again.`,
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
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

  const clearChat = async () => {
    // Clear on backend if we have a conversation
    if (conversationId) {
      try {
        await clearChatHistory(conversationId);
      } catch (err) {
        console.error('Failed to clear chat on server:', err);
      }
    }
    
    setConversationId(null);
    setError(null);
    setMessages([
      {
        id: Date.now(),
        role: 'assistant',
        content:
          "Chat cleared! I'm ready to help you with your course materials. What would you like to learn about?",
        sources: [],
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] flex items-center justify-center shadow-lg shadow-blue-500/30">
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
                  : message.isError
                  ? 'bg-gradient-to-br from-red-500 to-red-600'
                  : 'bg-gradient-to-br from-[#3B82F6] to-[#60A5FA]'
              )}
            >
              {message.role === 'user' ? (
                <User className="w-5 h-5 text-white" />
              ) : message.isError ? (
                <AlertCircle className="w-5 h-5 text-white" />
              ) : (
                <Bot className="w-5 h-5 text-white" />
              )}
            </div>

            {/* Message Content */}
            <div className="flex flex-col max-w-[75%]">
              <div
                className={cn(
                  "group relative px-4 py-3 rounded-2xl",
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-primary to-blue-600 text-white rounded-tr-sm'
                    : message.isError
                    ? 'bg-red-50 border border-red-200 text-red-800 rounded-tl-sm shadow-sm'
                    : 'bg-card border border-border text-foreground rounded-tl-sm shadow-sm'
                )}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert">
                  {message.content}
                </div>
                
                {/* Copy Button */}
                {message.role === 'assistant' && !message.isError && (
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
              
              {/* Sources - show for assistant messages with sources */}
              {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    Sources:
                  </span>
                  {message.sources.map((source, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary" 
                      className="text-xs py-0.5 px-2"
                    >
                      {source.title} ({source.similarity}%)
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* Intent badge for assistant messages */}
              {message.role === 'assistant' && message.intent && !message.isError && (
                <div className="mt-1">
                  <Badge variant="outline" className="text-xs capitalize">
                    {message.intent.replace('_', ' ')}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex gap-4 animate-fade-in">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] flex items-center justify-center shadow-lg">
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
            <p className="text-xs font-medium text-muted-foreground mb-3">✨ Try asking:</p>
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
