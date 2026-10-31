import React, { useState, useRef, useEffect } from 'react';
import { Send, Terminal, Trash2, Volume2, VolumeX, Bot, User } from 'lucide-react';
import { soundFX } from '../utils/audioEffects';

export default function CommandLogPanel({
  messages,
  onSendMessage,
  onClearLogs,
  ttsEnabled,
  onToggleTts,
}) {
  const [inputVal, setInputVal] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    soundFX.playConfirm();
    onSendMessage(inputVal.trim());
    setInputVal('');
  };

  return (
    <div className="hud-panel hud-panel-right">
      <div className="hud-panel-header">
        <div className="hud-panel-title">
          <Terminal size={16} />
          <span>NEURAL LOG &amp; FEED</span>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            className="hud-btn-icon"
            style={{ width: '28px', height: '28px' }}
            onClick={() => {
              soundFX.playClick();
              onToggleTts();
            }}
            title={ttsEnabled ? 'Mute Speech Synthesis (TTS)' : 'Enable Speech Synthesis'}
          >
            {ttsEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
          <button
            className="hud-btn-icon"
            style={{ width: '28px', height: '28px' }}
            onClick={() => {
              soundFX.playClick();
              onClearLogs();
            }}
            title="Purge Log Feed"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="hud-panel-body chat-history">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-msg ${msg.sender}`}>
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
              <span className="chat-time">{msg.time}</span>
            </div>
            <div className="chat-text">{msg.text}</div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="hud-chat-footer">
        <form onSubmit={handleSubmit} className="hud-input-row">
          <input
            type="text"
            className="hud-input-field"
            placeholder="Type command or query for Jarvis..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
          />
          <button type="submit" className="hud-send-btn" title="Transmit Command">
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
