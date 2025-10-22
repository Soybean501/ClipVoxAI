import { useState } from "react";

const initialState = {
  topic: "ClipVox clean slate",
  tone: "informal",
  style: "narrative",
  length: 5,
  chapters: 5,
  mode: "oneshot",
  draft: "",
};

export default function App() {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState("");
  const [error, setError] = useState("");

  const updateField = (field) => (event) => {
    setForm((prev) => ({
      ...prev,
      [field]: field === "length" || field === "chapters" ? Number(event.target.value) : event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setScript("");

    try {
      const response = await fetch("/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Generation failed");
      }

      const text = await response.text();
      setScript(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header>
        <h1>ClipVox Clean Deployment</h1>
        <p>Minimal UI to exercise the backend endpoints while we stabilize deployment.</p>
      </header>

      <main>
        <form className="generator-form" onSubmit={handleSubmit}>
          <label>
            Topic
            <input value={form.topic} onChange={updateField("topic")} required />
          </label>

          <label>
            Tone
            <input value={form.tone} onChange={updateField("tone")} />
          </label>

          <label>
            Style
            <input value={form.style} onChange={updateField("style")} />
          </label>

          <label>
            Length (minutes)
            <input type="number" min="1" value={form.length} onChange={updateField("length")} />
          </label>

          <label>
            Chapters
            <input type="number" min="1" value={form.chapters} onChange={updateField("chapters")} />
          </label>

          <label>
            Mode
            <select value={form.mode} onChange={updateField("mode")}>
              <option value="oneshot">Standard</option>
              <option value="craft">Craft (requires draft)</option>
            </select>
          </label>

          <label>
            Draft (optional)
            <textarea value={form.draft} onChange={updateField("draft")} rows={4} />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Generating..." : "Generate Script"}
          </button>
        </form>

        {error && (
          <section className="status error">
            <strong>Failed:</strong> {error}
          </section>
        )}

        {script && (
          <section className="output">
            <h2>Script</h2>
            <pre>{script}</pre>
          </section>
        )}
      </main>
    </div>
  );
}
