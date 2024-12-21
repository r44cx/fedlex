'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface RelevantLaw {
  id: string;
  title: string;
  book: string;
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [relevantLaws, setRelevantLaws] = useState<RelevantLaw[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Handle initial context from URL
  useEffect(() => {
    const context = searchParams.get('context');
    const title = searchParams.get('title');
    if (context && title) {
      setMessages([{
        role: 'user',
        content: `I want to know more about ${title}. Please explain it to me.`
      }]);
      handleChat(`I want to know more about ${title}. Please explain it to me.`, true);
    }
  }, [searchParams]);

  const handleChat = async (message: string, isInitial = false) => {
    if (!message.trim() || (isLoading && !isInitial)) return;

    if (!isInitial) {
      setMessages(prev => [...prev, { role: 'user', content: message }]);
    }
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: message,
          messages: [...messages, { role: 'user', content: message }],
          context: searchParams.get('context'),
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');
      
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response.text }]);
      setRelevantLaws(data.relevantLaws);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error while processing your request.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input;
    setInput('');
    await handleChat(message);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 flex">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="text-lg">Ask me anything about Swiss law</p>
                <p className="text-sm mt-2">I'll find the relevant laws and help you understand them</p>
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-2xl rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-900 shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-900 rounded-lg px-4 py-2 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t bg-white p-4">
            <form onSubmit={handleSubmit} className="flex space-x-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about Swiss law..."
                className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </div>

        {/* Relevant Laws Sidebar */}
        <div className="w-80 border-l bg-white overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Relevant Laws</h2>
            <div className="space-y-3">
              {relevantLaws.map((law) => (
                <div key={law.id} className="p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900">{law.title}</h3>
                  <p className="text-sm text-gray-500">{law.book}</p>
                </div>
              ))}
              {relevantLaws.length === 0 && (
                <p className="text-sm text-gray-500">
                  No relevant laws found yet. Start a conversation to see related laws.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 