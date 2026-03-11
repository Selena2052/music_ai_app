'use client';

import { useState, useRef, useEffect } from 'react';
import { useAiStore } from '@/stores/aiStore';
import { usePlayerStore } from '@/stores/playerStore';
import { Bot, Send, Trash2, Music2, Sparkles } from 'lucide-react';

// ── QUICK PROMPTS 
const QUICK_PROMPTS = [
    '🎵 Gợi ý nhạc cho buổi tối',
    '😢 Nhạc khi buồn',
    '💪 Nhạc tập gym',
    '☕ Nhạc làm việc tập trung',
    '🎉 Nhạc vui vẻ cuối tuần',
    '🌙 Nhạc thư giãn trước khi ngủ',
];

export default function ChatPage() {

    const { chatHistory, isTyping, sendChat, clearChat, loadChatHistory } = useAiStore();

    const { currentSong } = usePlayerStore();

    const [input, setInput] = useState('');

    const bottomRef = useRef<HTMLDivElement>(null);

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadChatHistory();
    }, []);

    useEffect(() => {
        const handleGlobalKey = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                inputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleGlobalKey);
        return () => window.removeEventListener('keydown', handleGlobalKey);
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, isTyping]);

    const handleSend = async () => {
        const msg = input.trim();
        if (!msg || isTyping) return;
        setInput(''); // xóa input ngay
        await sendChat(msg);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleQuickPrompt = (prompt: string) => {
        setInput(prompt);
        inputRef.current?.focus();
    };

    const handleAskAboutCurrent = () => {
        if (currentSong) {
            const msg = `Kể cho tôi nghe về bài "${currentSong.title}" của ${currentSong.artist}`;
            setInput(msg);
            inputRef.current?.focus();
        }
    };

    return (
        <div className="chat-page">
            <div className="chat-header">
                <div className="chat-header-info">
                    <div className="chat-avatar">
                        <Bot size={24} />
                    </div>
                    <div>
                        <h1 className="chat-title">MusicAI Chat</h1>
                        <p className="chat-subtitle">Hỏi về nhạc, gợi ý bài hát, phân tích lyrics...</p>
                    </div>
                </div>
                {chatHistory.length > 0 && (
                    <button className="btn-icon" onClick={clearChat} title="Xoá lịch sử">
                        <Trash2 size={18} />
                    </button>
                )}
            </div>
            <div className="chat-messages">

                {chatHistory.length === 0 ? (
                    <div className="chat-empty">
                        <div className="chat-empty-icon">
                            <Sparkles size={40} />
                        </div>
                        <h2>Xin chào! Tôi là MusicAI 🎵</h2>
                        <p>Hỏi tôi bất cứ điều gì về âm nhạc</p>
                        <div className="quick-prompts">
                            {QUICK_PROMPTS.map((prompt) => (
                                <button
                                    key={prompt}
                                    className="quick-prompt-btn"
                                    onClick={() => handleQuickPrompt(prompt)}
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>

                        {currentSong && (
                            <button className="btn-ask-current" onClick={handleAskAboutCurrent}>
                                <Music2 size={16} />
                                Hỏi về "{currentSong.title}" đang phát
                            </button>
                        )}
                    </div>

                ) : (
                    <>
                        {chatHistory.map((msg, i) => (
                            <div key={i} className={`chat-bubble-wrap ${msg.role === 'user' ? 'user' : 'ai'}`}>
                                {msg.role === 'ai' && (
                                    <div className="chat-bubble-avatar">
                                        <Bot size={16} />
                                    </div>
                                )}
                                <div className={`chat-bubble ${msg.role === 'user' ? 'bubble-user' : 'bubble-ai'}`}>
                                    {msg.content.split('\n').map((line, j) => (
                                        <span key={j}>
                                            {line}
                                            {j < msg.content.split('\n').length - 1 && <br />}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="chat-bubble-wrap ai">
                                <div className="chat-bubble-avatar">
                                    <Bot size={16} />
                                </div>
                                <div className="chat-bubble bubble-ai typing-indicator">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        )}

                        {currentSong && (
                            <div className="chat-current-song-hint">
                                <button className="btn-ask-current small" onClick={handleAskAboutCurrent}>
                                    <Music2 size={14} />
                                    Hỏi về "{currentSong.title}"
                                </button>
                            </div>
                        )}
                    </>
                )}

                <div ref={bottomRef} />
            </div>

            <div className="chat-input-area">
                <input
                    ref={inputRef}
                    className="chat-input"
                    type="text"
                    placeholder="Nhập tin nhắn..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isTyping}
                    autoFocus
                />
                <button
                    className={`chat-send-btn ${(!input.trim() || isTyping) ? 'disabled' : ''}`}
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                    title="Gửi tin nhắn"
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
}