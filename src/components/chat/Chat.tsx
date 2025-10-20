import React, { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE_URL } from '../../config/api';
import {
    startChatStream,
    ApiChatMessage,
    getSession,
    HttpError,
    listSessionsByUserId,
    getMessagesBySessionId,
    endSessionById,
    deleteSessionById
} from '../../services/chatService';

type Sender = 'user' | 'chatbot';
interface Message {
    sender: Sender;
    text: string;
}
interface Thread {
    id: string;          // server session _id
    title: string;       // simple label
    createdAt: number;
    updatedAt: number;
    preview: string;
    messageCount: number;
}

const Chat = () => {
    // UI state
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [userId, setUserId] = useState<string | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [threads, setThreads] = useState<Thread[]>([]);
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    // API base
    const CHAT_BASE = `${API_BASE_URL}/api/chat`;

    // Utilities
    const now = () => Date.now();

    // Read user from storage
    const getStoredUserId = (): string | null => {
        const raw = localStorage.getItem('user');
        if (raw) {
            try {
                const obj: unknown = JSON.parse(raw);
                if (obj && typeof obj === 'object') {
                    const rec = obj as Record<string, unknown>;
                    const id =
                        (rec.user && typeof rec.user === 'object' && (rec.user as Record<string, unknown>)?.id) ||
                        (rec.user && typeof rec.user === 'object' && (rec.user as Record<string, unknown>)?._id) ||
                        (rec.id as string | undefined) ||
                        (rec._id as string | undefined);
                    return id ? String(id) : null;
                }
            } catch { /* ignore */ }
        }
        return localStorage.getItem('chat_user_id');
    };

    // Mount logs
    useEffect(() => {
        console.log('[Chat] mounted');
        return () => console.log('[Chat] unmounted');
    }, []);

    // Restore userId
    useEffect(() => {
        const id = getStoredUserId();
        if (id) {
            console.log('[Chat] restored userId from storage.user:', id);
            setUserId(id);
        } else {
            console.log('[Chat] no stored userId');
        }
    }, []);

    const mapServerMessages = useCallback((server: ApiChatMessage[]): Message[] =>
        server.map((m) => ({ sender: m.sender === 'user' ? 'user' : 'chatbot', text: m.message })), []);

    const refreshThreads = useCallback(async (uid: string) => {
        try {
            const token = localStorage.getItem('auth_token') || undefined;
            const { sessions } = await listSessionsByUserId(CHAT_BASE, uid, 1, 50, token);
            const mapped: Thread[] = sessions.map((s, i) => {
                const created = s.createdAt || s.session_started;
                const updated = (s as { lastMessageAt?: string | number | Date }).lastMessageAt || s.updatedAt || s.session_started;
                return {
                    id: s._id,
                    title: `Chat ${sessions.length - i}`, // simple label; no title field on server
                    createdAt: created ? new Date(created).getTime() : now(),
                    updatedAt: updated ? new Date(updated).getTime() : now(),
                    preview: '',
                    messageCount: s.messageCount ?? 0,
                };
            }).sort((a, b) => b.updatedAt - a.updatedAt);
            setThreads(mapped);
            if (!activeThreadId && mapped[0]) {
                setActiveThreadId(mapped[0].id);
            }
        } catch (e) {
            console.error('Failed to load sessions', e);
        }
    }, [CHAT_BASE, activeThreadId]);

    // Ensure at least one session exists and load thread list
    useEffect(() => {
        if (!userId) return;
        (async () => {
            const token = localStorage.getItem('auth_token') || undefined;
            await refreshThreads(userId);
            // If no sessions were returned, ensure one exists via getSession
            if (threads.length === 0) {
                try {
                    const s = await getSession(CHAT_BASE, userId, token);
                    setSessionId(s?._id || null);
                } catch (e) {
                    console.warn('getSession failed, will rely on first message to create.', e);
                } finally {
                    await refreshThreads(userId);
                }
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    // Load messages for active session from server
    useEffect(() => {
        (async () => {
            if (!userId || !activeThreadId) return;
            try {
                setLoadingHistory(true);
                setError(null);
                setSessionId(activeThreadId);
                const token = localStorage.getItem('auth_token') || undefined;
                const serverMessages = await getMessagesBySessionId(CHAT_BASE, activeThreadId, 200, token);
                const mapped = mapServerMessages(serverMessages);
                setMessages(
                    mapped.length === 0
                        ? [{ sender: 'chatbot', text: 'Hi! This is a new session. Ask me anything to get started.' }]
                        : mapped
                );
            } catch (e) {
                if (e instanceof HttpError && e.status === 404) {
                    setMessages([{ sender: 'chatbot', text: 'Hi! This is a new session. Ask me anything to get started.' }]);
                } else {
                    console.error('Failed to load messages', e);
                    setError(e instanceof Error ? e.message : 'Failed to load messages');
                }
            } finally {
                setLoadingHistory(false);
            }
        })();
    }, [userId, activeThreadId, CHAT_BASE, mapServerMessages]);

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

        const endpoint = userId ? `${CHAT_BASE}/${encodeURIComponent(userId)}` : CHAT_BASE;
        console.log('[Chat] POST /api/chat', { endpoint, hasUserId: !!userId, chars: currentInput.length });

        try {
            const token = localStorage.getItem('auth_token') || undefined;

            const result = await startChatStream({
                endpoint,
                message: currentInput,
                userId,
                token,
                signal: controller.signal,
            });

            if (result.newUserId && !userId) {
                setUserId(result.newUserId);
                localStorage.setItem('chat_user_id', result.newUserId);
                console.log('[Chat] received x-user-id header:', result.newUserId);
            }

            if (result.jsonText !== undefined) {
                replaceLastBotText(() => result.jsonText || '(empty response)');
                console.log('[Chat] non-stream response complete');
                return;
            }

            if (!result.stream) {
                replaceLastBotText(() => '(no data)');
                console.log('[Chat] no stream returned');
                return;
            }

            let first = true;
            for await (const chunk of result.stream) {
                if (!chunk) continue;
                replaceLastBotText(prevText => (first ? chunk : prevText + chunk));
                first = false;
            }
            console.log('[Chat] stream finished');
            replaceLastBotText(prev => (prev === '...' ? '(no data)' : prev));

            // Refresh threads from server to update counts/timestamps
            if (userId) await refreshThreads(userId);
        } catch (err: unknown) {
            if (err instanceof DOMException && err.name === 'AbortError') {
                replaceLastBotText(() => '[stopped]');
                console.log('[Chat] request aborted');
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
        if (isStreaming) {
            console.log('[Chat] Stop pressed');
            abortRef.current?.abort();
        }
    };

    const handleNewChat = async () => {
        console.log('[Chat] New Chat');
        abortRef.current?.abort();
        setIsStreaming(false);
        setMessages([]);
        setInput('');
        setError(null);

        // End current session so the next message creates a new one
        try {
            if (activeThreadId) {
                const token = localStorage.getItem('auth_token') || undefined;
                await endSessionById(CHAT_BASE, activeThreadId, token);
            }
        } catch (e) {
            console.warn('End session failed (continuing):', e);
        }

        setActiveThreadId(null);
        setSessionId(null);
        if (userId) await refreshThreads(userId);
    };

    const handleSelectThread = (tid: string) => {
        setActiveThreadId(tid);
        setError(null);
        setIsSidebarOpen(false);
    };

    const handleRenameThread = (tid: string) => {
        // No title field on server; keep local-only label
        const title = prompt('Rename chat', threads.find(t => t.id === tid)?.title || 'New chat');
        if (!title) return;
        setThreads(prev => prev.map(t => (t.id === tid ? { ...t, title } : t)));
    };

    const handleDeleteThread = async (tid: string) => {
        try {
            const token = localStorage.getItem('auth_token') || undefined;
            await deleteSessionById(CHAT_BASE, tid, token);
            if (userId) {
                await refreshThreads(userId);
                const nextId = (prev => prev[0]?.id || null)(threads);
                setActiveThreadId(nextId);
            }
            setMessages([]);
        } catch (e) {
            console.error('Delete session failed', e);
            setError(e instanceof Error ? e.message : 'Failed to delete session');
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto p-2 md:p-4">
            <div className="grid grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)] gap-4 h-[80vh]">
                {/* Sidebar */}
                <aside
                    className={`fixed md:relative z-20 md:z-auto w-[280px] md:w-auto h-full bg-white dark:bg-[#0f141b] transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                        } md:translate-x-0 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col`}
                >
                    <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Your chats</span>
                        <button
                            type="button"
                            onClick={handleNewChat}
                            className="text-xs px-2 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                            title="Start a new chat"
                        >
                            New
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {threads.length === 0 ? (
                            <div className="p-4 text-sm text-gray-500 dark:text-gray-400">No chats yet</div>
                        ) : (
                            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                                {threads.map(t => (
                                    <li
                                        key={t.id}
                                        className={`group px-3 py-2.5 cursor-pointer transition-colors ${t.id === activeThreadId
                                            ? 'bg-blue-50 dark:bg-[#162032]'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                            }`}
                                        onClick={() => handleSelectThread(t.id)}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                    {t.title || 'New chat'}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                                    {t.preview || 'No messages yet'}
                                                </div>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 flex-shrink-0">
                                                <button
                                                    type="button"
                                                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        handleRenameThread(t.id);
                                                    }}
                                                    title="Rename"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-red-500"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        handleDeleteThread(t.id);
                                                    }}
                                                    title="Delete"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">
                                            {new Date(t.updatedAt).toLocaleString()} • {t.messageCount} msg
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </aside>

                {/* Chat panel */}
                <div className="chat h-full w-full flex flex-col min-h-0">
                    <div className="shrink-0 mb-3">
                        <div className="rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-[1px] shadow-lg">
                            <div className="flex items-center justify-between rounded-xl bg-white/70 dark:bg-[#0f141b]/70 backdrop-blur px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                        className="md:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300"
                                        title="Toggle chats"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                                    </button>
                                    <div className="h-8 w-8 rounded-lg bg-white dark:bg-[#121923] flex items-center justify-center shadow flex-shrink-0">
                                        <span className="text-xl">🤖</span>
                                    </div>
                                    <div>
                                        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">InfoXP Assistant</h1>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Real-time streaming responses
                                        </p>
                                    </div>
                                    {sessionId && (
                                        <span
                                            title={sessionId}
                                            className="ml-3 text-[10px] px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hidden sm:block"
                                        >
                                            Session • {sessionId.slice(-6)}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {isStreaming && (
                                        <button
                                            type="button"
                                            onClick={stopStreaming}
                                            className="px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 shadow-sm flex items-center gap-1.5 transition-colors"
                                        >
                                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            <span className="text-sm font-medium">Stop</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative flex-1 min-h-0 bg-white dark:bg-[#171D25] rounded-xl shadow-md overflow-hidden">
                        <div className="h-full overflow-y-auto">
                            <div className="p-4 pb-36">
                                {loadingHistory && messages.length === 0 ? (
                                    <div className="space-y-3">
                                        <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                                        <div className="h-20 w-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
                                        <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="h-full flex items-center justify-center">
                                        <div className="text-center text-gray-500 dark:text-gray-400">
                                            <div className="text-3xl mb-2">💬</div>
                                            <p className="text-sm">No messages in this chat yet. Say hello!</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {messages.map((m, i) => (
                                            <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                <div
                                                    className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm transition-colors ${m.sender === 'user'
                                                        ? 'bg-blue-600 text-white rounded-br-lg'
                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-lg'
                                                        }`}
                                                >
                                                    <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={messagesEndRef} />
                                    </div>
                                )}
                            </div>

                            {/* Floating composer */}
                            <div className="absolute bottom-0 left-0 right-0 z-10">
                                <div className="bg-gradient-to-t from-white dark:from-[#171D25] via-white/80 dark:via-[#171D25]/80 to-transparent px-3 sm:px-4 pt-6 pb-4">
                                    <form onSubmit={handleSendMessage} className="mx-auto max-w-3xl flex gap-2 items-center">
                                        <input
                                            type="text"
                                            value={input}
                                            onChange={e => setInput(e.target.value)}
                                            placeholder="Message InfoXP Assistant..."
                                            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f141b] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
                                            disabled={isStreaming}
                                        />
                                        <button
                                            type="submit"
                                            disabled={!input.trim() || isStreaming}
                                            className="px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed shadow transition-colors"
                                            title="Send"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                                        </button>
                                    </form>
                                    {error && <p className="mx-auto max-w-3xl mt-2 text-sm text-red-600 text-center">{error}</p>}
                                    {!userId && (
                                        <p className="mx-auto max-w-3xl mt-2 text-xs text-gray-500 text-center">
                                            A user ID will be assigned automatically on your first message.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* End ChatGPT-style container */}
                </div>
            </div>
        </div>
    );
};

export default Chat;