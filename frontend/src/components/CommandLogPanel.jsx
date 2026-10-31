import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Terminal,
  Volume2,
  VolumeX,
  Bot,
  User,
  PlusCircle,
  History,
  Trash2,
  ChevronRight,
  Database,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { soundFX } from '../utils/audioEffects';

export default function CommandLogPanel({
  messages,
  onSendMessage,
  ttsEnabled,
  onToggleTts,
  // New Chat & History props
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  isBackendConnected,
}) {
  const [inputVal, setInputVal] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!showHistory) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showHistory]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    soundFX.playConfirm();
    onSendMessage(inputVal.trim());
    setInputVal('');
  };

  const handleNewChatClick = () => {
    soundFX.playConfirm();
    onNewChat();
    setShowHistory(false);
  };

  const handleSelectSessionClick = (id) => {
    soundFX.playClick();
    onSelectSession(id);
    setShowHistory(false);
  };

  const handleDeleteSessionClick = (e, id) => {
    e.stopPropagation();
    soundFX.playAlert();
    onDeleteSession(id);
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <div className="hud-panel hud-panel-right">
      {/* Header with Title and Mode Controls */}
      <div className="hud-panel-header">
        <div className="hud-panel-title">
          <Terminal size={16} />
          <span>{showHistory ? 'SAVED SESSIONS' : 'NEURAL FEED'}</span>
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {/* New Chat Button */}
          <button
            className="hud-action-btn"
            style={{ padding: '4px 10px', fontSize: '0.68rem', height: '28px', gap: '4px' }}
            onClick={handleNewChatClick}
            title="Create a New Chat Session"
          >
            <PlusCircle size={13} />
            <span>NEW CHAT</span>
          </button>

          {/* Toggle History View */}
          <button
            className={`hud-btn-icon ${showHistory ? 'active' : ''}`}
            style={{ width: '28px', height: '28px' }}
            onClick={() => {
              soundFX.playClick();
              setShowHistory(!showHistory);
            }}
            title={showHistory ? 'Back to Chat Feed' : 'View Chat History'}
          >
            <History size={14} />
          </button>

          {/* TTS Toggle */}
          <button
            className="hud-btn-icon"
            style={{ width: '28px', height: '28px' }}
            onClick={() => {
              soundFX.playClick();
              onToggleTts();
            }}
            title={ttsEnabled ? 'Mute Voice Synthesis' : 'Enable Voice Synthesis'}
          >
            {ttsEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
        </div>
      </div>

      {/* Sub-bar showing active thread title and database connection */}
      <div
        style={{
          padding: '6px 14px',
          background: 'rgba(0, 0, 0, 0.4)',
          borderBottom: '1px solid rgba(var(--hud-primary-rgb), 0.12)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.68rem',
        }}
      >
        <span
          style={{
            color: 'var(--hud-accent)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '210px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <MessageSquare size={11} />
          {activeSession ? activeSession.title : 'Neural Thread 01'}
        </span>

        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: isBackendConnected ? 'var(--hud-success)' : 'var(--hud-warn)',
          }}
          title={isBackendConnected ? 'Connected to FastAPI & SQLite' : 'Offline local mode'}
        >
          <Database size={11} />
          {isBackendConnected ? 'SQLITE LIVE' : 'STANDBY'}
        </span>
      </div>

      {/* Content Area: Chat History List OR Active Chat Messages */}
      {showHistory ? (
        <div className="hud-panel-body" style={{ padding: '10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: '#7a9bb6', fontSize: '0.85rem' }}>
                No saved neural sessions found. Click <strong>+ NEW CHAT</strong> to initiate one.
              </div>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleSelectSessionClick(s.id)}
                  style={{
                    background: s.id === activeSessionId ? 'rgba(var(--hud-primary-rgb), 0.15)' : 'rgba(0, 0, 0, 0.4)',
                    border: `1px solid ${s.id === activeSessionId ? 'var(--hud-primary)' : 'rgba(var(--hud-primary-rgb), 0.18)'}`,
                    borderRadius: '6px',
                    padding: '9px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (s.id !== activeSessionId) e.currentTarget.style.borderColor = 'var(--hud-primary)';
                  }}
                  onMouseLeave={(e) => {
                    if (s.id !== activeSessionId) e.currentTarget.style.borderColor = 'rgba(var(--hud-primary-rgb), 0.18)';
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', overflow: 'hidden' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-hud)',
                        fontSize: '0.78rem',
                        color: s.id === activeSessionId ? '#ffffff' : '#d2e8ff',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '240px',
                      }}
                    >
                      {s.title}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: '#799bb8' }}>
                      {new Date(s.updated_at || s.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {' '}&bull; {s.message_count || 0} msgs
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      className="hud-btn-icon"
                      style={{ width: '24px', height: '24px', border: 'none', background: 'transparent' }}
                      onClick={(e) => handleDeleteSessionClick(e, s.id)}
                      title="Delete Session"
                    >
                      <Trash2 size={13} color="#ff5577" />
                    </button>
                    <ChevronRight size={14} color="var(--hud-primary)" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="hud-panel-body chat-history">
          {messages.map((msg, idx) => (
            <div key={msg.id || idx} className={`chat-msg ${msg.sender}`}>
              <div className="chat-msg-header">
                <span className="chat-sender">
                  {msg.sender === 'user' ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <User size={12} /> USER
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Bot size={12} /> J.A.R.V.I.S.
                    </span>
                  )}
                </span>
                <span className="chat-time">
                  {msg.time || (msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour12: false }) : '')}
                </span>
              </div>
              <div className="chat-text">{msg.text}</div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      )}

      {/* Input row at bottom */}
      <div className="hud-chat-footer">
        <form onSubmit={handleSubmit} className="hud-input-row">
          <input
            type="text"
            className="hud-input-field"
            placeholder={showHistory ? 'Switching to conversation feed...' : 'Type directive or query for Jarvis...'}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onFocus={() => {
              if (showHistory) setShowHistory(false);
            }}
          />
          <button type="submit" className="hud-send-btn" title="Transmit Directive">
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
