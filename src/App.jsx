// src/App.jsx
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import "./index.css";

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]); // [{ role, content }]
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendPrompt = async () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    const userMsg = { role: "user", content: trimmed };
    setMessages((m) => [...m, userMsg]);
    setPrompt("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/openrouter", {
        // Vercel rewrites to the function
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-oss-20b",
          messages: [{ role: "user", content: trimmed }],
          temperature: 0.7,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? "API error");
      }

      const data = await res.json();
      const assistantMsg = {
        role: "assistant",
        content: data.choices[0].message.content,
      };
      setMessages((m) => [...m, assistantMsg]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <h1>OpenRouter + GPT‑OSS‑20B Demo</h1>

      <div className="chat">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {m.content}
            </ReactMarkdown>
          </div>
        ))}
      </div>

      {loading && <p className="loading">AI is thinking…</p>}
      {error && <p className="error">{error}</p>}

      <textarea
        rows={4}
        placeholder="Ask or type anything…"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        disabled={loading}
      />

      <button onClick={sendPrompt} disabled={loading}>
        {loading ? "Sending…" : "Send"}
      </button>
    </div>
  );
}
