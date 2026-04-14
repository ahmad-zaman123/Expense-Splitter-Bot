import { useEffect, useRef, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";
const SESSION_KEY = "splitter.sessionId";
const HISTORY_KEY = "splitter.history";

const newSessionId = () =>
  `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const now = () => Date.now();

const WELCOME = {
  from: "bot",
  text:
    "👋 Hey! I'm the *Expense Splitter Bot*.\n\nTry:\n• `add Riya 500`\n• `add Aman 300`\n• `split`\n\nType *help* for all commands.",
  t: now(),
};

// Tiny markdown: *bold*, _italic_, `code`, newlines.
function format(text) {
  const escape = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escape(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*([^*\n]+)\*/g, "<strong>$1</strong>")
    .replace(/_([^_\n]+)_/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
}

function formatTime(t) {
  const d = new Date(t);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

function Ticks() {
  return (
    <svg className="ticks" viewBox="0 0 16 11" width="16" height="11" aria-hidden="true">
      <path
        fill="#53bdeb"
        d="M11.071.653a.457.457 0 0 0-.304-.102.47.47 0 0 0-.381.178l-5.19 6.46-2.133-2.076a.446.446 0 0 0-.644.019l-.557.595a.458.458 0 0 0 .018.645l3.104 2.95a.46.46 0 0 0 .672-.06l5.996-7.563a.458.458 0 0 0-.076-.645l-.505-.401zm4.144 0a.457.457 0 0 0-.304-.102.47.47 0 0 0-.381.178l-5.19 6.46-.289-.281-.772.973 1.014.962a.46.46 0 0 0 .672-.06l5.996-7.563a.458.458 0 0 0-.076-.645l-.67-.401z"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path fill="currentColor" d="M1.101 21.757 23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path fill="currentColor" d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
    </svg>
  );
}

function EmojiIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm7 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm-7.7 3a4.5 4.5 0 0 0 8.4 0H7.8z" />
    </svg>
  );
}

function AttachIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path fill="currentColor" d="m16.5 6.5-9.19 9.19a3.5 3.5 0 0 0 4.95 4.95l9.19-9.19a5.5 5.5 0 0 0-7.78-7.78L4.22 12.72a7.5 7.5 0 1 0 10.61 10.61l8.49-8.49-1.41-1.41-8.49 8.49a5.5 5.5 0 1 1-7.78-7.78L14.13 5.09a3.5 3.5 0 0 1 4.95 4.95l-9.19 9.19a1.5 1.5 0 1 1-2.12-2.12l9.19-9.19-1.46-1.42z" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path fill="currentColor" d="M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm0 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
    </svg>
  );
}

export default function App() {
  const [sessionId] = useState(() => {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = newSessionId();
    localStorage.setItem(SESSION_KEY, id);
    return id;
  });

  const [messages, setMessages] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || "null");
      if (Array.isArray(saved) && saved.length) {
        return saved.map((m) => ({ ...m, t: m.t ?? now() }));
      }
      return [WELCOME];
    } catch {
      return [WELCOME];
    }
  });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(messages));
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setMessages((m) => [...m, { from: "user", text, t: now() }]);
    setBusy(true);
    try {
      const res = await fetch(`${API}/api/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, text }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { from: "bot", text: data.reply ?? "⚠️ No reply.", t: now() }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { from: "bot", text: "⚠️ Network error. Is the backend running?", t: now() },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    setMenuOpen(false);
    await fetch(`${API}/api/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    }).catch(() => {});
    setMessages([{ ...WELCOME, t: now() }]);
  }

  const today = new Date().toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const hasInput = input.trim().length > 0;

  return (
    <div className="page">
      <div className="chat">
        <header className="chat__header">
          <button className="icon-btn header-back" title="Back">
            <BackIcon />
          </button>
          <div className="avatar">
            <span>💸</span>
          </div>
          <div className="header-info">
            <div className="header-name">Expense Splitter Bot</div>
            <div className="header-status">
              {busy ? "typing…" : "online"}
            </div>
          </div>
          <div className="header-actions">
            <button
              className="icon-btn"
              title="More"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <MoreIcon />
            </button>
            {menuOpen && (
              <div className="menu" onMouseLeave={() => setMenuOpen(false)}>
                <button className="menu-item" onClick={reset}>Clear chat</button>
              </div>
            )}
          </div>
        </header>

        <div className="chat__body" ref={scrollRef}>
          <div className="date-chip">{today}</div>
          <div className="system-chip">🔒 Messages are end-to-end encrypted.</div>

          {messages.map((m, i) => (
            <div key={i} className={`row row--${m.from}`}>
              <div className={`bubble bubble--${m.from}`}>
                <span
                  className="bubble__text"
                  dangerouslySetInnerHTML={{ __html: format(m.text) }}
                />
                <span className="meta">
                  <span className="time">{formatTime(m.t)}</span>
                  {m.from === "user" && <Ticks />}
                </span>
              </div>
            </div>
          ))}

          {busy && (
            <div className="row row--bot">
              <div className="bubble bubble--bot bubble--typing">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            </div>
          )}
        </div>

        <form className="chat__input" onSubmit={send}>
          <button type="button" className="icon-btn input-icon" title="Emoji">
            <EmojiIcon />
          </button>
          <button type="button" className="icon-btn input-icon" title="Attach">
            <AttachIcon />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message"
            autoFocus
          />
          <button
            type="submit"
            className="send-btn"
            disabled={busy || !hasInput}
            title={hasInput ? "Send" : "Voice"}
          >
            {hasInput ? <SendIcon /> : <MicIcon />}
          </button>
        </form>
      </div>
    </div>
  );
}
