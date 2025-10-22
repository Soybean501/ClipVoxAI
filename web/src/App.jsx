import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { motion } from "framer-motion";
import { AudioLines, Bot, Loader2, MountainSnow, Sparkles, Wand2 } from "lucide-react";

const defaultForm = {
  topic: "",
  tone: "Educational",
  style: "Documentary",
  length: 8,
  chapters: 6,
  draft: "",
  languageCode: "en-US",
  voiceName: "en-US-Chirp-HD-F",
  modelName: "chirp",
  speakingRate: 1.0,
  pitch: 0,
  audioEncoding: "LINEAR16",
};

const voicePresets = [
  { label: "Chirp HD F · Storyteller", value: "en-US-Chirp-HD-F" },
  { label: "Chirp HD D · Confident", value: "en-US-Chirp-HD-D" },
  { label: "Chirp HD O · Educator", value: "en-US-Chirp-HD-O" },
];

const toneOptions = ["Educational", "Inspirational", "Investigative", "Dramatic", "Conversational"];
const styleOptions = ["Documentary", "Narrative", "Newsroom", "Explainer", "Interview"];

function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-base-800 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-90 blur-3xl" aria-hidden>
        <div className="absolute inset-0 bg-aurora-gradient" />
      </div>

      <motion.header
        className="relative z-10 flex flex-col items-center px-6 py-10 md:px-10"
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <nav className="flex w-full max-w-6xl items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
              <Sparkles className="h-6 w-6 text-accent-purple" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.6em] text-white/60">ClipVox Studio</p>
              <p className="font-heading text-xl">Cinematic AI Narratives</p>
            </div>
          </div>
          <div className="hidden items-center gap-4 md:flex">
            <a
              href="/auth/sign-in"
              className="rounded-full border border-white/12 px-5 py-2 text-xs font-medium uppercase tracking-[0.35em] text-white/70 transition hover:border-white/30 hover:text-white"
            >
              Sign In
            </a>
            <a
              href="/auth/request-access"
              className="rounded-full border border-accent-purple/60 bg-accent-purple/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-accent-purple/40"
            >
              Request Access
            </a>
          </div>
        </nav>

        <section className="mt-16 grid w-full max-w-6xl gap-12 lg:grid-cols-[1.1fr,0.9fr]">
          <motion.div
            className="glass-panel relative overflow-hidden p-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/0" />
            <div className="relative space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-white/70">
                <Bot className="h-4 w-4 text-accent-cyan" />
                ClipVox Agents
              </div>
              <h1 className="max-w-xl font-heading text-4xl leading-tight tracking-tight text-white sm:text-5xl">
                Plan, write, and voice long-form videos with cinematic polish.
              </h1>
              <p className="max-w-lg text-base text-white/70">
                Outline chapters, generate scripts, and render neural voiceovers from a single command center. ClipVox
                keeps momentum across multi-part stories, documentaries, and educational series.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/studio"
                  className="accent-gradient flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-glow transition hover:-translate-y-0.5"
                >
                  <Wand2 className="h-4 w-4" />
                  Launch Studio
                </Link>
                <a
                  href="/auth/sign-in"
                  className="group flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white/70 transition hover:border-white/40 hover:text-white"
                >
                  <AudioLines className="h-4 w-4 transition group-hover:text-accent-cyan" />
                  Sign In
                </a>
              </div>
              <div className="grid gap-6 pt-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/50">Workflow</p>
                  <p className="mt-2 font-heading text-xl text-white">Outline → Script → Voice</p>
                  <p className="mt-1 text-xs text-white/50">One continuous flow with review checkpoints.</p>
                </div>
                <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/50">Voice Engine</p>
                  <p className="mt-2 font-heading text-xl text-white">Chirp HD</p>
                  <p className="mt-1 text-xs text-white/50">Neural narration with controllable pacing.</p>
                </div>
                <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/50">Collab Ready</p>
                  <p className="mt-2 font-heading text-xl text-white">Draft Alignment</p>
                  <p className="mt-1 text-xs text-white/50">Blend your outlines with ClipVox guidance.</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="glass-panel relative overflow-hidden p-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/15 via-transparent to-accent-cyan/10" />
            <div className="relative flex h-full flex-col justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.45em] text-white/50">Pipeline</p>
                <h2 className="mt-3 font-heading text-2xl text-white">What runs inside the studio</h2>
                <p className="mt-3 text-sm text-white/65">
                  Outline synthesis, chapter-by-chapter drafting, style continuity checks, and Chirp HD voice mapping —
                  carefully orchestrated so every minute stays on-theme.
                </p>
              </div>
              <ul className="mt-8 space-y-4 text-sm text-white/70">
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-accent-purple shadow-glow" />
                  Generate structured outlines keyed to your runtime target.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-accent-cyan shadow-glow" />
                  Draft each chapter sequentially with tone safeguards.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-accent-pink shadow-glow" />
                  Render Chirp HD voiceovers with per-chapter adjustments.
                </li>
              </ul>
              <div className="mt-10">
                <div className="relative">
                  <motion.div
                    className="h-40 w-full rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-white/5 p-6"
                    animate={{
                      boxShadow: [
                        "0 0 0 rgba(139, 92, 246, 0.4)",
                        "0 0 45px rgba(6, 182, 212, 0.35)",
                        "0 0 0 rgba(236, 72, 153, 0.4)",
                      ],
                    }}
                    transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-white/50">Status</p>
                        <p className="mt-2 font-heading text-lg text-white">Studio access available</p>
                      </div>
                      <MountainSnow className="h-10 w-10 text-white/30" />
                    </div>
                    <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className="h-1.5 w-24 rounded-full bg-gradient-to-r from-accent-purple via-accent-cyan to-accent-pink"
                        animate={{ x: ["-40%", "120%"] }}
                        transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                      />
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      </motion.header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-24 md:px-10">
        <section className="glass-panel p-10">
          <div className="flex flex-col gap-8 md:flex-row md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.45em] text-white/50">Use Cases</p>
              <h2 className="mt-2 font-heading text-3xl text-white">How creators use ClipVox</h2>
            </div>
            <div className="flex gap-3">
              <Link
                to="/studio"
                className="accent-gradient flex items-center gap-2 rounded-full px-5 py-3 text-xs font-semibold uppercase tracking-wide text-white shadow-glow transition hover:-translate-y-0.5"
              >
                Launch Studio
              </Link>
              <a
                href="/auth/sign-in"
                className="rounded-full border border-white/15 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-white/70 transition hover:border-white/30 hover:text-white"
              >
                Sign In
              </a>
            </div>
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Documentaries</p>
              <p className="mt-3 font-heading text-lg text-white">Plan long arcs with confidence</p>
              <p className="mt-3 text-sm text-white/65">
                Rapidly sketch act structures, ensure call-backs land, and keep a human voice via guided drafting.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Education</p>
              <p className="mt-3 font-heading text-lg text-white">Deliver cohesive lesson series</p>
              <p className="mt-3 text-sm text-white/65">
                Standardize tone and pacing across an entire curriculum while customizing voice for each module.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Studios</p>
              <p className="mt-3 font-heading text-lg text-white">Iterate branded scripts quickly</p>
              <p className="mt-3 text-sm text-white/65">
                Import existing drafts, align to updated briefs, and render voice previews for stakeholder reviews.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 bg-black/40 px-6 py-10 text-sm text-white/50 md:px-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-accent-purple" />
            <p className="font-heading text-lg text-white">ClipVox Studio</p>
          </div>
          <div className="flex gap-6 text-xs uppercase tracking-[0.35em] text-white/40">
            <a href="/auth/sign-in" className="hover:text-white">
              Sign In
            </a>
            <a href="/auth/request-access" className="hover:text-white">
              Request Access
            </a>
            <Link to="/studio" className="hover:text-white">
              Studio
            </Link>
          </div>
          <p>© {new Date().getFullYear()} ClipVox. Build cinematic AI stories.</p>
        </div>
      </footer>
    </div>
  );
}

function StudioPage() {
  const [form, setForm] = useState(defaultForm);
  const [mode, setMode] = useState("oneshot");
  const [script, setScript] = useState("");
  const [scriptMeta, setScriptMeta] = useState(null);
  const [audioSegments, setAudioSegments] = useState([]);
  const [activeSegment, setActiveSegment] = useState(0);
  const [loadingScript, setLoadingScript] = useState(false);
  const [loadingVoice, setLoadingVoice] = useState(false);
  const [error, setError] = useState("");
  const [voiceMessage, setVoiceMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const chapterDuration = useMemo(() => {
    if (!form.length || !form.chapters) return "—";
    const minutes = Number(form.length);
    const chapters = Number(form.chapters);
    if (Number.isNaN(minutes) || Number.isNaN(chapters) || chapters <= 0) return "—";
    const perChapter = minutes / chapters;
    return `${perChapter.toFixed(1)} min / chapter`;
  }, [form.length, form.chapters]);

  useEffect(() => {
    return () => {
      audioSegments.forEach((segment) => URL.revokeObjectURL(segment.url));
    };
  }, [audioSegments]);

  const updateField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const resetVoicePlayer = () => {
    audioSegments.forEach((segment) => URL.revokeObjectURL(segment.url));
    setAudioSegments([]);
    setActiveSegment(0);
    setVoiceMessage("");
  };

  const handleGenerateScript = async (event) => {
    event.preventDefault();
    setError("");
    setCopied(false);
    resetVoicePlayer();
    if (!form.topic.trim()) {
      setError("Please define a clear topic before generating.");
      return;
    }
    if (mode === "craft" && !form.draft.trim()) {
      setError("Guided mode needs a draft so the AI can align with your voice.");
      return;
    }
    setLoadingScript(true);
    try {
      const payload = {
        topic: form.topic,
        tone: form.tone,
        style: form.style,
        length: Number(form.length) || 5,
        chapters: Number(form.chapters) || 5,
        mode,
        draft: mode === "craft" ? form.draft : undefined,
      };
      const res = await fetch("/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || "Script generation failed.");

      setScript(text.trim());
      setScriptMeta({
        topic: form.topic,
        tone: form.tone,
        style: form.style,
        length: payload.length,
        chapters: payload.chapters,
        generatedAt: new Date().toISOString(),
        mode,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error generating script.");
    } finally {
      setLoadingScript(false);
    }
  };

  const handleGenerateVoice = async () => {
    if (!script.trim()) {
      setError("Generate a script first, then synthesize the voice.");
      return;
    }
    resetVoicePlayer();
    setLoadingVoice(true);
    setError("");
    try {
      const payload = {
        text: script,
        audioEncoding: form.audioEncoding,
        speakingRate: Number(form.speakingRate) || 1,
        pitch: Number(form.pitch) || 0,
        languageCode: form.languageCode || "en-US",
        voiceName: form.voiceName || "en-US-Chirp-HD-F",
        modelName: form.modelName || "chirp",
      };
      const res = await fetch("/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Voice synthesis failed.");

      const segmentsData = Array.isArray(data.segments) ? data.segments : [];
      if (segmentsData.length === 0) {
        throw new Error("Voice synthesis failed: no audio returned.");
      }

      const mime =
        payload.audioEncoding === "MP3"
          ? "audio/mpeg"
          : payload.audioEncoding === "OGG_OPUS"
          ? "audio/ogg"
          : "audio/wav";

      const newSegments = segmentsData.map((segment, idx) => {
        const audioBytes = Uint8Array.from(atob(segment.audioContent), (c) => c.charCodeAt(0));
        const blob = new Blob([audioBytes.buffer], { type: mime });
        return {
          index: idx,
          text: segment.text,
          url: URL.createObjectURL(blob),
        };
      });

      setAudioSegments(newSegments);
      setActiveSegment(0);
      if (data.exceededLimit) {
        setVoiceMessage(
          `Script exceeded the single-request limit. Audio was split into ${newSegments.length} segments.`
        );
      } else if (newSegments.length > 1) {
        setVoiceMessage(`Audio delivered in ${newSegments.length} segments. Play or download each in order.`);
      } else {
        setVoiceMessage("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error synthesizing voice.");
    } finally {
      setLoadingVoice(false);
    }
  };

  const handleCopy = async () => {
    if (!script) return;
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError("Unable to copy to clipboard on this device.");
    }
  };

  return (
    <div className="min-h-screen bg-base-800 text-white">
      <header className="border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 md:px-10">
          <Link to="/" className="flex items-center gap-3 text-white">
            <Sparkles className="h-5 w-5 text-accent-purple" />
            <span className="font-heading text-lg">ClipVox Studio</span>
          </Link>
          <nav className="flex gap-4 text-xs uppercase tracking-[0.35em] text-white/50">
            <button
              onClick={() => setMode("oneshot")}
              className={`rounded-full px-3 py-2 transition ${
                mode === "oneshot" ? "bg-white/10 text-white" : "hover:text-white/80"
              }`}
            >
              One-shot
            </button>
            <button
              onClick={() => setMode("craft")}
              className={`rounded-full px-3 py-2 transition ${
                mode === "craft" ? "bg-white/10 text-white" : "hover:text-white/80"
              }`}
            >
              Guided
            </button>
            <a href="/auth/sign-in" className="rounded-full px-3 py-2 hover:text-white/80">
              Sign In
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10 md:px-10">
        {error && (
          <div className="glass-panel border border-red-400/20 bg-red-500/10 px-6 py-4 text-sm text-red-100">
            {error}
          </div>
        )}

        <section className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="glass-panel p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/50">Script Builder</p>
                <h3 className="mt-2 font-heading text-2xl">Generate Narrative</h3>
              </div>
              <div className="rounded-2xl bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-white/60">
                Chapter pacing · {chapterDuration}
              </div>
            </div>

            <form className="space-y-6" onSubmit={handleGenerateScript}>
              <div className="grid gap-6 md:grid-cols-2">
                <label className="block text-sm text-white/60">
                  Topic
                  <input
                    type="text"
                    name="topic"
                    value={form.topic}
                    onChange={(e) => updateField("topic", e.target.value)}
                    placeholder="e.g. The untold history of the Silk Road"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-accent-purple focus:outline-none focus:ring-2 focus:ring-accent-purple/40"
                    required
                  />
                </label>
                <label className="block text-sm text-white/60">
                  Tone
                  <select
                    name="tone"
                    value={form.tone}
                    onChange={(e) => updateField("tone", e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-accent-purple focus:outline-none focus:ring-2 focus:ring-accent-purple/40"
                  >
                    {toneOptions.map((option) => (
                      <option key={option} value={option} className="bg-base-800 text-white">
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <label className="block text-sm text-white/60">
                  Style
                  <select
                    name="style"
                    value={form.style}
                    onChange={(e) => updateField("style", e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-accent-purple focus:outline-none focus:ring-2 focus:ring-accent-purple/40"
                  >
                    {styleOptions.map((option) => (
                      <option key={option} value={option} className="bg-base-800 text-white">
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-6">
                  <label className="block text-sm text-white/60">
                    Length (mins)
                    <input
                      type="number"
                      min="1"
                      name="length"
                      value={form.length}
                      onChange={(e) => updateField("length", e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-accent-purple focus:outline-none focus:ring-2 focus:ring-accent-purple/40"
                    />
                  </label>
                  <label className="block text-sm text-white/60">
                    Chapters
                    <input
                      type="number"
                      min="1"
                      name="chapters"
                      value={form.chapters}
                      onChange={(e) => updateField("chapters", e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-accent-purple focus:outline-none focus:ring-2 focus:ring-accent-purple/40"
                    />
                  </label>
                </div>
              </div>

              {mode === "craft" && (
                <label className="block text-sm text-white/60">
                  Guided draft input
                  <textarea
                    name="draft"
                    value={form.draft}
                    onChange={(e) => updateField("draft", e.target.value)}
                    placeholder="Paste your outline, script beats, or draft paragraphs..."
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-cyan/40"
                    rows={6}
                  />
                </label>
              )}

              <button
                type="submit"
                className="accent-gradient flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-glow transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loadingScript}
              >
                {loadingScript ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                {loadingScript ? "Generating" : "Generate Script"}
              </button>
            </form>
          </div>

          <div id="voice-card" className="glass-panel space-y-6 p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-accent-cyan/20 p-3">
                <AudioLines className="h-5 w-5 text-accent-cyan" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/50">Voice Engine</p>
                <h3 className="font-heading text-xl">Chirp HD Synthesis</h3>
              </div>
            </div>

            <p className="text-sm text-white/65">
              Render a voice pass for the script using Google Chirp HD neural voices. Adjust speaking rate, pitch, and
              encoding, then refine as needed.
            </p>

            <div className="grid gap-4">
              <label className="text-xs uppercase tracking-[0.3em] text-white/50">
                Voice persona
                <select
                  name="voiceName"
                  value={form.voiceName}
                  onChange={(e) => updateField("voiceName", e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-cyan/40"
                >
                  {voicePresets.map((preset) => (
                    <option key={preset.value} value={preset.value} className="bg-base-800 text-white">
                      {preset.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="text-xs uppercase tracking-[0.3em] text-white/50">
                  Speaking rate
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="1.5"
                    value={form.speakingRate}
                    onChange={(e) => updateField("speakingRate", e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-cyan/40"
                  />
                </label>
                <label className="text-xs uppercase tracking-[0.3em] text-white/50">
                  Pitch
                  <input
                    type="number"
                    step="0.1"
                    min="-10"
                    max="10"
                    value={form.pitch}
                    onChange={(e) => updateField("pitch", e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-cyan/40"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="text-xs uppercase tracking-[0.3em] text-white/50">
                  Audio encoding
                  <select
                    name="audioEncoding"
                    value={form.audioEncoding}
                    onChange={(e) => updateField("audioEncoding", e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-cyan/40"
                  >
                    <option value="LINEAR16" className="bg-base-800 text-white">
                      WAV (Linear PCM)
                    </option>
                    <option value="MP3" className="bg-base-800 text-white">
                      MP3
                    </option>
                    <option value="OGG_OPUS" className="bg-base-800 text-white">
                      OGG Opus
                    </option>
                  </select>
                </label>
                <label className="text-xs uppercase tracking-[0.3em] text-white/50">
                  Model
                  <input
                    type="text"
                    name="modelName"
                    value={form.modelName}
                    onChange={(e) => updateField("modelName", e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-cyan/40"
                  />
                </label>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerateVoice}
              className="accent-gradient flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-glow transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loadingVoice || !script}
            >
              {loadingVoice ? <Loader2 className="h-4 w-4 animate-spin" /> : <AudioLines className="h-4 w-4" />}
              {loadingVoice ? "Rendering Voice" : "Generate Voice"}
            </button>

            {audioSegments.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                    Preview segment {activeSegment + 1} / {audioSegments.length}
                  </p>
                  <span className="text-[10px] uppercase tracking-[0.35em] text-white/30">
                    {form.audioEncoding}
                  </span>
                </div>
                <audio
                  key={audioSegments[activeSegment]?.url}
                  src={audioSegments[activeSegment]?.url}
                  controls
                  className="mt-3 w-full"
                />
                {voiceMessage && <p className="mt-3 text-xs text-accent-cyan/90">{voiceMessage}</p>}
                {audioSegments.length > 1 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.35em] text-white/45">Segments</p>
                    <div className="flex flex-col gap-2">
                      {audioSegments.map((segment, idx) => {
                        const label = segment.text.replace(/\s+/g, " ").slice(0, 80);
                        return (
                          <div
                            key={segment.url}
                            className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs ${
                              idx === activeSegment
                                ? "border-accent-cyan/60 bg-accent-cyan/10 text-white"
                                : "border-white/10 bg-white/0 text-white/70"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setActiveSegment(idx);
                              }}
                              className="flex-1 text-left"
                            >
                              Segment {idx + 1}: {label}
                              {segment.text.length > 80 ? "…" : ""}
                            </button>
                            <a
                              href={segment.url}
                              download={`clipvox-segment-${idx + 1}.${form.audioEncoding === "MP3" ? "mp3" : form.audioEncoding === "OGG_OPUS" ? "ogg" : "wav"}`}
                              className="ml-3 rounded-full border border-white/15 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-white/60 hover:border-white/35 hover:text-white"
                            >
                              Save
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {audioSegments.length === 1 && (
                  <p className="mt-2 text-xs text-white/45">
                    Download from the player or adjust settings and re-render.
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="glass-panel p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/50">Generated Script</p>
                <h3 className="mt-2 font-heading text-2xl">Narrative Output</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  disabled={!script}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-white/60 transition hover:border-white/30 hover:text-white disabled:opacity-40"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  onClick={() => {
                    if (!script) return;
                    const blob = new Blob([script], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${form.topic || "clipvox-script"}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  disabled={!script}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-white/60 transition hover:border-white/30 hover:text-white disabled:opacity-40"
                >
                  Export
                </button>
              </div>
            </div>

            <div className="mt-6 min-h-[280px] rounded-3xl border border-white/10 bg-black/30 p-6">
              {loadingScript && (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-white/70">
                  <Loader2 className="h-8 w-8 animate-spin text-accent-purple" />
                  <p>Sequencing outline, chapters, and narrative flow...</p>
                </div>
              )}

              {!loadingScript && script && (
                <article className="prose prose-invert max-w-none text-white/80">
                  {script.split("\n\n").map((block, index) => (
                    <p key={index} className="leading-relaxed">
                      {block}
                    </p>
                  ))}
                </article>
              )}

              {!loadingScript && !script && (
                <div className="flex h-full items-center justify-center text-sm text-white/40">
                  Your script will appear here once generated.
                </div>
              )}
            </div>

            {scriptMeta && (
              <div className="mt-6 grid gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-xs text-white/50 sm:grid-cols-2">
                <div>
                  <p className="uppercase tracking-[0.35em]">Topic</p>
                  <p className="mt-1 text-white/80">{scriptMeta.topic}</p>
                </div>
                <div>
                  <p className="uppercase tracking-[0.35em]">Profile</p>
                  <p className="mt-1 text-white/80">
                    {scriptMeta.tone} · {scriptMeta.style}
                  </p>
                </div>
                <div>
                  <p className="uppercase tracking-[0.35em]">Runtime</p>
                  <p className="mt-1 text-white/80">
                    {scriptMeta.length} min · {scriptMeta.chapters} chapters
                  </p>
                </div>
                <div>
                  <p className="uppercase tracking-[0.35em]">Generated</p>
                  <p className="mt-1 text-white/80">
                    {new Date(scriptMeta.generatedAt).toLocaleString(undefined, { hour12: false })}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="glass-panel p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/5 p-3">
                <Sparkles className="h-5 w-5 text-accent-pink" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/50">Project Capsules</p>
                <h3 className="font-heading text-xl">Workflow patterns</h3>
              </div>
            </div>
            <ul className="mt-6 space-y-5 text-sm text-white/70">
              <li className="rounded-2xl border border-white/5 bg-white/[0.04] p-4">
                <p className="font-heading text-lg text-white">Deep-dive documentary</p>
                <p className="mt-2 text-xs uppercase tracking-[0.35em] text-white/40">
                  45 min · 8 chapters · Chirp HD F
                </p>
                <p className="mt-3 text-sm text-white/60">
                  Use guided mode with research notes, then iterate on voice pacing for each act.
                </p>
              </li>
              <li className="rounded-2xl border border-white/5 bg-white/[0.04] p-4">
                <p className="font-heading text-lg text-white">Educational series</p>
                <p className="mt-2 text-xs uppercase tracking-[0.35em] text-white/40">
                  12 episodes · 12 mins · Chirp HD O
                </p>
                <p className="mt-3 text-sm text-white/60">
                  Batch generate lessons with consistent tone; reuse voice settings for continuity.
                </p>
              </li>
              <li className="rounded-2xl border border-white/5 bg-white/[0.04] p-4">
                <p className="font-heading text-lg text-white">Sales narrative</p>
                <p className="mt-2 text-xs uppercase tracking-[0.35em] text-white/40">
                  6 min · 4 chapters · Chirp HD D
                </p>
                <p className="mt-3 text-sm text-white/60">
                  Generate one-shot drafts, then fine-tune pitch and speed to match brand delivery.
                </p>
              </li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black/30 px-6 py-8 text-xs uppercase tracking-[0.35em] text-white/40 md:px-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <span>© {new Date().getFullYear()} ClipVox Studio</span>
          <div className="flex gap-5">
            <Link to="/">Landing</Link>
            <a href="/auth/sign-in">Account</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/studio" element={<StudioPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
