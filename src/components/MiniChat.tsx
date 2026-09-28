import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, Team } from '../types/game';
import { MessageSquare, Send, DollarSign, Sparkles } from 'lucide-react';

interface MiniChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  playerTeam: Team;
  onRequestLock?: () => void;
  onFocusChange?: (focused: boolean) => void;
}

export const MiniChat: React.FC<MiniChatProps> = ({
  messages,
  onSendMessage,
  playerTeam,
  onRequestLock,
  onFocusChange
}) => {
  const [inputText, setInputText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Global shortcut: Press Enter or 'Y' to open chat (when not already typing)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Enter' || e.code === 'KeyY') {
        e.preventDefault();
        setIsFocused(true);
        onFocusChange?.(true);
        setTimeout(() => inputRef.current?.focus(), 10);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [onFocusChange]);

  const handleFocus = () => {
    setIsFocused(true);
    onFocusChange?.(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    onFocusChange?.(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Stop propagation so engine doesn't receive WASD, Space, etc. while typing
    e.stopPropagation();

    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = inputText.trim();
      if (trimmed) {
        onSendMessage(trimmed);
        setInputText('');
      }
      inputRef.current?.blur();
      onRequestLock?.();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setInputText('');
      inputRef.current?.blur();
      onRequestLock?.();
    }
  };

  // Channel badge detection from input text
  const isCoinCommand = inputText.trim().toLowerCase().startsWith('/coin1000');
  const isAllCommand = inputText.trim().toLowerCase().startsWith('/all');

  return (
    <div className="w-[280px] flex flex-col font-mono text-xs select-none pointer-events-auto bg-transparent mt-1">
      {/* 1. Transparent Messages Area (No background box) */}
      <div className="max-h-[140px] overflow-y-auto space-y-1 py-1 pr-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {messages.slice(-7).map((msg) => {
          const isRed = (msg.senderTeam || msg.team) === 'red';
          const isBlue = (msg.senderTeam || msg.team) === 'blue';
          const isSys = msg.isSystem || msg.channel === 'system';
          const isAllMsg = msg.isAll || msg.channel === 'all';

          return (
            <div
              key={msg.id}
              className="leading-tight text-[11px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] drop-shadow-[0_0_2px_rgba(0,0,0,1)] break-words animate-fadeIn"
            >
              {isSys ? (
                <div className="text-emerald-300 font-bold flex items-center gap-1">
                  <span className="bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded text-[9px] border border-emerald-500/40">
                    [HỆ THỐNG]
                  </span>
                  <span>{msg.text}</span>
                </div>
              ) : isAllMsg ? (
                <div>
                  <span className="bg-amber-500/25 text-amber-300 px-1 py-0.2 rounded text-[9px] border border-amber-500/40 font-bold mr-1">
                    [TẤT CẢ]
                  </span>
                  <span className={isRed ? 'text-red-400 font-bold' : isBlue ? 'text-sky-400 font-bold' : 'text-neutral-300 font-bold'}>
                    {msg.senderName}:
                  </span>{' '}
                  <span className="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">{msg.text}</span>
                </div>
              ) : (
                <div>
                  <span
                    className={`px-1 py-0.2 rounded text-[9px] border font-bold mr-1 ${
                      isRed
                        ? 'bg-red-500/25 text-red-300 border-red-500/40'
                        : 'bg-sky-500/25 text-sky-300 border-sky-500/40'
                    }`}
                  >
                    [ĐỘI]
                  </span>
                  <span className={isRed ? 'text-red-400 font-bold' : 'text-sky-400 font-bold'}>
                    {msg.senderName}:
                  </span>{' '}
                  <span className="text-neutral-100 drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">{msg.text}</span>
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 2. Interactive Input Bar */}
      <div className="mt-1 flex items-center gap-1.5">
        <div
          className={`flex-1 flex items-center gap-1 px-2 py-1 rounded transition-all duration-150 ${
            isFocused
              ? 'bg-black/60 border border-emerald-400/60 shadow-lg backdrop-blur-sm'
              : 'bg-black/25 border border-white/10 hover:border-white/30'
          }`}
        >
          {/* Target Channel Pill */}
          {isCoinCommand ? (
            <span className="text-[9px] font-black uppercase tracking-wider px-1 py-0.5 rounded bg-emerald-500/30 text-emerald-300 border border-emerald-400/50 flex items-center gap-0.5">
              <DollarSign className="w-2.5 h-2.5" />
              +1,000$
            </span>
          ) : isAllCommand ? (
            <span className="text-[9px] font-black uppercase tracking-wider px-1 py-0.5 rounded bg-amber-500/30 text-amber-300 border border-amber-400/50">
              [TẤT CẢ]
            </span>
          ) : (
            <span
              className={`text-[9px] font-black uppercase tracking-wider px-1 py-0.5 rounded border ${
                playerTeam === 'red'
                  ? 'bg-red-500/30 text-red-300 border-red-500/50'
                  : 'bg-sky-500/30 text-sky-300 border-sky-500/50'
              }`}
            >
              [ĐỘI]
            </span>
          )}

          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={isFocused ? 'Nhập tin nhắn (/all, /coin1000)...' : 'Nhấn [Enter] để chat...'}
            className="w-full bg-transparent text-white text-[11px] focus:outline-none placeholder:text-neutral-400/70"
            maxLength={120}
          />
        </div>

        {/* Quick /coin1000 Cheat Button */}
        <button
          onClick={() => {
            onSendMessage('/coin1000');
            onRequestLock?.();
          }}
          title="Tăng nhanh +1,000$ tiền mặt (/coin1000)"
          className="h-6 px-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center gap-0.5 transition-colors cursor-pointer shrink-0"
        >
          <Sparkles className="w-2.5 h-2.5 text-yellow-300" />
          <span>+1K$</span>
        </button>
      </div>

      {/* Helpful Hint */}
      {isFocused && (
        <div className="text-[9px] text-neutral-400/90 mt-0.5 flex items-center justify-between px-0.5">
          <span>Gõ <b className="text-amber-300">/all </b> để chat 2 đội</span>
          <span>Gõ <b className="text-emerald-300">/coin1000</b> nhận 1000$</span>
        </div>
      )}
    </div>
  );
};
