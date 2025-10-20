export type ChunkStream = AsyncGenerator<string, void, unknown>;

export interface StartChatParams {
    endpoint: string;
    message: string;
    userId?: string | null;
    token?: string | null;
    signal?: AbortSignal;
    extraBody?: Record<string, unknown>;
}

export interface StartChatResult {
    newUserId?: string | null;
    contentType?: string | null;
    jsonText?: string;
    stream?: ChunkStream;
    response: Response;
}

export class HttpError extends Error {
    response: Response;
    status: number;
    statusText: string;
    constructor(message: string, response: Response) {
        super(message);
        this.name = "HttpError";
        this.response = response;
        this.status = response.status;
        this.statusText = response.statusText;
    }
}

export async function startChatStream(params: StartChatParams): Promise<StartChatResult> {
    const { endpoint, message, userId, token, signal, extraBody } = params;

    console.log('[chatService] POST', { endpoint, hasUserId: !!userId, msgChars: message.length });

    const res = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream, text/plain, application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message, userId, ...extraBody }),
        signal,
    });

    const newUserId = res.headers.get("x-user-id");
    const contentType = res.headers.get("content-type") || "";

    console.log('[chatService] response', { status: res.status, contentType, newUserId });

    if (!res.ok) {
        const errPayload = await res.text().catch(() => "");
        throw new HttpError(`HTTP ${res.status} ${res.statusText} :: ${errPayload}`, res);
    }

    // No body or JSON fallback (non-stream)
    if (!res.body || contentType.includes("application/json")) {
        console.log('[chatService] non-stream JSON fallback');
        let text = "";
        try {
            const data = await res.json();
            text =
                (data as { reply?: string; message?: string })?.reply ??
                (data as { reply?: string; message?: string })?.message ??
                JSON.stringify(data);
        } catch {
            text = await res.text();
        }
        return { newUserId, contentType, jsonText: text || "(empty response)", response: res };
    }

    // Streaming parser factories
    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    // Plain text chunk stream
    async function* plainTextStream(): ChunkStream {
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                if (chunk) yield chunk;
            }
        } finally {
            try { reader.releaseLock(); } catch (e) { void e; }
        }
    }

    // SSE stream (server-sent events)
    async function* sseStream(): ChunkStream {
        let buffer = "";
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const parts = buffer.split(/\n\n/);
                buffer = parts.pop() || "";
                for (const evt of parts) {
                    const lines = evt.split(/\r?\n/);
                    const dataLines: string[] = [];
                    let eventType: string | undefined;
                    for (const line of lines) {
                        if (!line || line.startsWith(":")) continue;
                        if (line.startsWith("event:")) {
                            eventType = line.slice(6).trim();
                        } else if (line.startsWith("data:")) {
                            dataLines.push(line.slice(5).trimStart());
                        }
                    }
                    const data = dataLines.join("\n");
                    if (!data) continue;
                    if (data === "[DONE]" || eventType === "done") {
                        return;
                    }
                    yield data;
                }
            }
        } finally {
            try { reader.releaseLock(); } catch (e) { void e; }
        }
    }

    const useSse = contentType.includes("text/event-stream");
    console.log('[chatService] streaming mode', useSse ? 'sse' : 'plain');

    const stream = useSse ? sseStream() : plainTextStream();

    return { newUserId, contentType, stream, response: res };
}

export interface ApiChatMessage {
    _id: string;
    chat_session_id: string;
    sender: "user" | "chatbot" | "tool" | "system";
    message: string;
    createdAt?: string;
    timestamp?: string;
}

export interface ApiSession {
    _id: string;
    user_id: string;
    session_started: string;
    session_ended?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface ApiSessionSummary extends ApiSession {
    messageCount?: number;
    lastMessageAt?: string;
}

export async function getSession(baseEndpoint: string, userId: string, token?: string): Promise<ApiSession> {
    const url = `${baseEndpoint}/session/${encodeURIComponent(userId)}`;
    console.log('[chatService] GET session', url);
    const res = await fetch(url, {
        headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });
    if (!res.ok) throw new HttpError(`HTTP ${res.status} ${res.statusText}`, res);
    const data = (await res.json()) as { session: ApiSession };
    console.log('[chatService] session result', data?.session?._id);
    return data.session;
}

export async function getSessionMessages(
    baseEndpoint: string,
    userId: string,
    limit = 100,
    token?: string
): Promise<ApiChatMessage[]> {
    const url = `${baseEndpoint}/session/${encodeURIComponent(userId)}/messages?limit=${limit}`;
    console.log('[chatService] GET messages', { url, limit });
    const res = await fetch(url, {
        headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });
    if (!res.ok) throw new HttpError(`HTTP ${res.status} ${res.statusText}`, res);
    const data = (await res.json()) as { sessionId: string; messages: ApiChatMessage[] };
    console.log('[chatService] messages result', { count: data.messages?.length ?? 0, sessionId: data.sessionId });
    return data.messages;
}

// List sessions for a user
export async function listSessionsByUserId(
    baseEndpoint: string,
    userId: string,
    page = 1,
    limit = 50,
    token?: string
): Promise<{ total: number; page: number; pageSize: number; pages: number; sessions: ApiSessionSummary[] }> {
    const url = `${baseEndpoint}/sessions/${encodeURIComponent(userId)}?page=${page}&limit=${limit}`;
    const res = await fetch(url, {
        headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });
    if (!res.ok) throw new HttpError(`HTTP ${res.status} ${res.statusText}`, res);
    return (await res.json()) as {
        total: number; page: number; pageSize: number; pages: number; sessions: ApiSessionSummary[];
    };
}

// Get messages by session id
export async function getMessagesBySessionId(
    baseEndpoint: string,
    sessionId: string,
    limit = 100,
    token?: string
): Promise<ApiChatMessage[]> {
    const url = `${baseEndpoint}/session/${encodeURIComponent(sessionId)}/messages/by-id?limit=${limit}`;
    const res = await fetch(url, {
        headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });
    if (!res.ok) throw new HttpError(`HTTP ${res.status} ${res.statusText}`, res);
    const data = (await res.json()) as { sessionId: string; messages: ApiChatMessage[] };
    return data.messages;
}

// End a session
export async function endSessionById(baseEndpoint: string, sessionId: string, token?: string): Promise<ApiSession> {
    const url = `${baseEndpoint}/session/${encodeURIComponent(sessionId)}/end`;
    const res = await fetch(url, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });
    if (!res.ok) throw new HttpError(`HTTP ${res.status} ${res.statusText}`, res);
    const data = (await res.json()) as { session: ApiSession };
    return data.session;
}

// Delete a session
export async function deleteSessionById(baseEndpoint: string, sessionId: string, token?: string): Promise<boolean> {
    const url = `${baseEndpoint}/session/${encodeURIComponent(sessionId)}`;
    const res = await fetch(url, {
        method: "DELETE",
        headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });
    if (!res.ok) throw new HttpError(`HTTP ${res.status} ${res.statusText}`, res);
    const data = (await res.json()) as { deleted: boolean };
    return !!data.deleted;
}