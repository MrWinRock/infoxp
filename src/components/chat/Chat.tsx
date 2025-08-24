import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../config/api';

interface Message {
    sender: 'user' | 'chatbot';
    text: string;
}

const Chat = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [userId, setUserId] = useState<string | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    const CHAT_ENDPOINT = `${API_BASE_URL}/api/chat`;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const t = setTimeout(scrollToBottom, 50);
        return () => clearTimeout(t);
    }, [messages]);

    useEffect(() => () => abortRef.current?.abort(), []);

    const appendBotPlaceholder = () =>
        setMessages(prev => [...prev, { sender: 'chatbot', text: '...' }]);

    const replaceLastBotText = (updater: (prevText: string) => string) => {
        setMessages(prev => {
            const last = prev[prev.length - 1];
            if (!last || last.sender !== 'chatbot') return prev;
            const clone = [...prev];
            clone[clone.length - 1] = { sender: 'chatbot', text: updater(last.text) };
            return clone;
        });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isStreaming) return;

        setError(null);
        const currentInput = input;
        setInput('');
        setMessages(prev => [...prev, { sender: 'user', text: currentInput }]);
        appendBotPlaceholder();
        setIsStreaming(true);

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(CHAT_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'text/event-stream, text/plain, application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ message: currentInput, userId }),
                signal: controller.signal
            });

            const newUserId = res.headers.get('x-user-id');
            if (newUserId && !userId) setUserId(newUserId);

            const contentType = res.headers.get('content-type') || '';

            if (!res.ok) {
                const errPayload = await res.text().catch(() => '');
                throw new Error(`HTTP ${res.status} ${res.statusText} :: ${errPayload}`);
            }

            if (!res.body || /application\/json/.test(contentType)) {
                let bodyText = '';
                try {
                    const data = await res.json();
                    bodyText = (data.reply || data.message || JSON.stringify(data));
                } catch {
                    bodyText = await res.text();
                }
                replaceLastBotText(() => bodyText || '(empty response)');
                return;
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let first = true;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                if (!chunk) continue;

                replaceLastBotText(prevText =>
                    first ? chunk : prevText + chunk
                );
                first = false;
            }

            replaceLastBotText(prev => (prev === '...' ? '(no data)' : prev));
        } catch (err: unknown) {
            if (err instanceof DOMException && err.name === 'AbortError') {
                replaceLastBotText(() => '[stopped]');
            } else {
                console.error('Chat request error:', err);
                setError(err instanceof Error ? err.message : 'Request failed');
                replaceLastBotText(() => 'Sorry, an error occurred. Please try again.');
            }
        } finally {
            setIsStreaming(false);
        }
    };

    const stopStreaming = () => {
        if (isStreaming) abortRef.current?.abort();
    };

    return (
        <div className="chat flex flex-col h-[calc(100vh-10rem)] w-full max-w-4xl mx-auto bg-white dark:bg-[#171D25] rounded-lg shadow-lg mt-24">
            <h1 className="text-2xl font-bold p-4 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-t-lg">
                Chatbot
            </h1>
            <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-3 rounded-lg max-w-lg shadow-md ${m.sender === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                                <p className="whitespace-pre-wrap">{m.text}</p>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-[#171D25] rounded-b-lg">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                        disabled={isStreaming}
                    />
                    {isStreaming ? (
                        <button
                            type="button"
                            onClick={stopStreaming}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                            Stop
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={!input.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400"
                        >
                            Send
                        </button>
                    )}
                </form>
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>
        </div>
    );
};

export default Chat;