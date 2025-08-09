import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
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
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        // A slight delay ensures the new message is rendered before scrolling
        setTimeout(scrollToBottom, 100);
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isStreaming) return;

        const userMessage: Message = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');

        // Add a placeholder for the bot's response
        setMessages(prev => [...prev, { sender: 'chatbot', text: '...' }]);
        setIsStreaming(true);

        try {
            const response = await axios({
                method: 'POST',
                url: `${API_BASE_URL}/chat`,
                data: {
                    message: currentInput,
                    userId: userId,
                },
                responseType: 'stream'
            });
            const newUserId = response.headers['x-user-id'];
            if (newUserId && !userId) {
                setUserId(newUserId);
            }

            const reader = response.data.getReader();
            if (!reader) {
                throw new Error('Failed to get response reader');
            }
            const decoder = new TextDecoder();
            let isFirstChunk = true;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });

                setMessages(prev => {
                    const lastMessageIndex = prev.length - 1;
                    const updatedMessages = [...prev];
                    if (isFirstChunk) {
                        updatedMessages[lastMessageIndex].text = chunk;
                        isFirstChunk = false;
                    } else {
                        updatedMessages[lastMessageIndex].text += chunk;
                    }
                    return updatedMessages;
                });
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => {
                const lastMessageIndex = prev.length - 1;
                if (prev[lastMessageIndex]?.sender === 'chatbot') {
                    const updatedMessages = [...prev];
                    updatedMessages[lastMessageIndex].text = 'Sorry, an error occurred. Please try again.';
                    return updatedMessages;
                }
                return prev;
            });
        } finally {
            setIsStreaming(false);
        }
    };

    return (
        <div className="chat flex flex-col h-[calc(100vh-10rem)] w-full max-w-4xl mx-auto bg-white dark:bg-[#171D25] rounded-lg shadow-lg mt-24">
            <h1 className="text-2xl font-bold p-4 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-t-lg">Chatbot</h1>
            <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-end ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-3 rounded-lg max-w-lg shadow-md ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-[#171D25] rounded-b-lg">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                        disabled={isStreaming}
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400 dark:disabled:bg-blue-800"
                        disabled={isStreaming || !input.trim()}
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Chat;