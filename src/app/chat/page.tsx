'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { ArticleReferences } from '@/components/ArticleReferences';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  id?: string;
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const initialQueryHandled = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Get initial query and selected books from URL
  useEffect(() => {
    const query = searchParams.get('query');
    const books = searchParams.get('books')?.split(',').filter(Boolean) || [];
    const hasAttachments = searchParams.get('hasAttachments') === 'true';

    if (query && !initialQueryHandled.current) {
      initialQueryHandled.current = true;
      handleInitialQuery(query, books, hasAttachments);
    }
  }, [searchParams]);

  const simulateTyping = async (content: string) => {
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Minimum typing time
    setIsTyping(false);
    return content;
  };

  const handleInitialQuery = async (query: string, books: string[], hasAttachments: boolean) => {
    setIsLoading(true);
    const messageId = Date.now().toString();
    setMessages(prev => [...prev, { role: 'user', content: query, id: messageId }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          selectedBooks: books,
          sessionId: null,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');
      
      const data = await response.json();
      setSessionId(data.sessionId);
      const typedMessage = await simulateTyping(data.message);
      setMessages(prev => [...prev, { role: 'assistant', content: typedMessage, id: Date.now().toString() }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error processing your request.',
        id: Date.now().toString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const userMessageId = Date.now().toString();
    setInput('');
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: userMessage, id: userMessageId }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          sessionId,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');
      
      const data = await response.json();
      const typedMessage = await simulateTyping(data.message);
      setMessages(prev => [...prev, { role: 'assistant', content: typedMessage, id: Date.now().toString() }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error processing your request.',
        id: Date.now().toString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex">
      <Sidebar />
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth">
          <div className="max-w-4xl mx-auto space-y-4">
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${
                    message.role === 'assistant' ? 'justify-start' : 'justify-end'
                  }`}
                >
                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className={`rounded-lg px-4 py-2 max-w-[80%] shadow-lg transform transition-all duration-200 hover:shadow-xl ${
                      message.role === 'assistant'
                        ? 'bg-white text-[#333333] border border-[#e5e5e5] hover:border-[#0c387b]'
                        : 'bg-[#0c387b] text-white hover:bg-[#0c387b]/90'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
            {(isLoading || isTyping) && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex justify-start"
              >
                <div className="bg-white rounded-lg px-6 py-3 shadow-lg border border-[#e5e5e5]">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="w-2 h-2 bg-[#dc1f3d] rounded-full"
                      />
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.2
                        }}
                        className="w-2 h-2 bg-[#dc1f3d] rounded-full"
                      />
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.4
                        }}
                        className="w-2 h-2 bg-[#dc1f3d] rounded-full"
                      />
                    </div>
                    <span className="text-sm text-[#666666]">AI is typing...</span>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="border-t border-[#e5e5e5] bg-white p-4 shadow-lg"
        >
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmit(e))}
                placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                rows={3}
                disabled={isLoading}
                className="w-full p-4 pr-24 text-[#333333] bg-[#f7f7f7] border-2 border-[#e5e5e5] rounded-lg focus:ring-2 focus:ring-[#0c387b] focus:border-transparent resize-none placeholder-[#666666] transition-all duration-200"
              />
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="absolute right-3 top-3 px-6 py-2 bg-[#dc1f3d] text-white rounded-md hover:bg-[#b01832] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                Send
              </motion.button>
            </div>
          </form>
        </motion.div>
      </main>
      <AnimatePresence mode="wait">
        {messages.length > 0 && messages[messages.length - 1].role === 'assistant' && (
          <ArticleReferences 
            key="article-references"
            message={messages[messages.length - 1].content} 
          />
        )}
      </AnimatePresence>
    </div>
  );
} 