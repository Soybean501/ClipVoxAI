import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AudioLines, Bot, Check, ChevronDown, Loader2, MountainSnow, Sparkles, Wand2 } from "lucide-react";
import { useAuth } from "./context/AuthContext.jsx";
import { supabase } from "./lib/supabaseClient.js";
import JSZip from "jszip";

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
const AUTH_MODES = [
  {
    id: "sign-in",
    label: "Sign In",
    caption: "Returning users",
    tag: "Welcome back",
    heading: "Sign in to ClipVox Studio",
    description: "Enter your credentials to continue orchestrating your narratives.",
    cta: "Sign In",
    passwordHelper: "Use the password you chose during onboarding. You can reset it if you’ve forgotten.",
  },
  {
    id: "sign-up",
    label: "Request Access",
    caption: "New storytellers",
    tag: "Request access",
    heading: "Create your ClipVox account",
    description: "Use a strong password—at least 10 characters with a mix of numbers and symbols.",
    cta: "Create Account",
    passwordHelper: "Minimum 10 characters recommended with at least one number and symbol.",
  },
];

const getModeDetails = (id) => AUTH_MODES.find((mode) => mode.id === id) ?? AUTH_MODES[0];

const STUDIO_MODES = {
  oneshot: {
    label: "One-shot",
    description: "Generate a fresh outline and script from scratch using the fields below.",
  },
  craft: {
    label: "Guided",
    description: "Paste your outline or beats so the AI can match your narrative voice.",
  },
};

const STUDIO_STEPS = [
  {
    id: "brief",
    label: "Project Brief",
    summary: "Set the intent, duration, and voice.",
  },
  {
    id: "script",
    label: "Script Generation",
    summary: "AI drafts the narrative structure.",
  },
  {
    id: "voice",
    label: "Voice Rendering",
    summary: "Synthesize and download voice tracks.",
  },
];

const parseScriptSections = (text) => {
  if (!text) return [];
  const blocks = text.split(/\n{2,}/);
  const sections = [];
  const headingRegex = /^(chapter|act|section)\b/i;
  const enumeratedRegex = /^(\d+\.|\d+\)|[A-Z]\.)\s+/;

  let currentSection = null;

  blocks.forEach((rawBlock) => {
    const trimmed = rawBlock.trim();
    if (!trimmed) return;
    const [firstLine, ...restLines] = trimmed.split("\n");
    const remainder = restLines.join("\n").trim();
    if (headingRegex.test(firstLine) || enumeratedRegex.test(firstLine)) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: firstLine.trim(),
        content: remainder ? [remainder] : [],
      };
    } else {
      if (!currentSection) {
        currentSection = { title: "", content: [] };
      }
      currentSection.content.push(trimmed);
    }
  });

  if (currentSection) {
    sections.push(currentSection);
  }

  if (sections.length === 0) {
    return blocks
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block, index) => ({
        title: `Section ${index + 1}`,
        content: [block],
      }));
  }

  return sections.map((section, index) => ({
    title: section.title || `Section ${index + 1}`,
    content: section.content.length > 0 ? section.content : ["—"],
  }));
};

const formatDuration = (seconds) => {
  if (seconds == null || Number.isNaN(seconds)) return "—";
  const totalSeconds = Math.round(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainder = totalSeconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
};

const getAudioDuration = (url) =>
  new Promise((resolve) => {
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.src = url;
    const cleanup = () => {
      audio.removeAttribute("src");
      audio.load();
    };
    audio.addEventListener(
      "loadedmetadata",
      () => {
        resolve(audio.duration || null);
        cleanup();
      },
      { once: true }
    );
    audio.addEventListener(
      "error",
      () => {
        resolve(null);
        cleanup();
      },
      { once: true }
    );
    audio.load();
  });

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

function LandingPage() {
  const { user, signOut } = useAuth();
  const isAuthenticated = Boolean(user);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      setMobileMenuOpen(false);
    } catch (err) {
      console.error("Failed to sign out", err);
    }
  };

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
            {isAuthenticated ? (
              <>
                <Link
                  to="/studio"
                  className="rounded-full border border-accent-purple/60 bg-accent-purple/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-accent-purple/40"
                >
                  Enter Studio
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-full border border-white/12 px-5 py-2 text-xs font-medium uppercase tracking-[0.35em] text-white/70 transition hover:border-white/30 hover:text-white"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth?mode=sign-in"
                  className="rounded-full border border-white/12 px-5 py-2 text-xs font-medium uppercase tracking-[0.35em] text-white/70 transition hover:border-white/30 hover:text-white"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth?mode=sign-up"
                  className="rounded-full border border-accent-purple/60 bg-accent-purple/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-accent-purple/40"
                >
                  Request Access
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 md:hidden">
            <Link
              to={isAuthenticated ? "/studio" : "/auth?mode=sign-in"}
              className="rounded-full border border-white/15 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-white transition hover:border-white/30 hover:text-white"
            >
              {isAuthenticated ? "Studio" : "Sign In"}
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-controls="landing-mobile-menu"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/80 transition hover:border-white/35 hover:text-white"
            >
              <span className="sr-only">Toggle menu</span>
              <motion.span
                className="flex h-4 w-4 flex-col justify-between"
                animate={mobileMenuOpen ? { rotate: 90 } : { rotate: 0 }}
                transition={{ duration: 0.25 }}
              >
                <span className="block h-[2px] w-full rounded bg-white" />
                <span className="block h-[2px] w-full rounded bg-white" />
                <span className="block h-[2px] w-full rounded bg-white" />
              </motion.span>
            </button>
          </div>
        </nav>

        <motion.div
          id="landing-mobile-menu"
          initial={false}
          animate={mobileMenuOpen ? "open" : "closed"}
          variants={{
            open: { height: "auto", opacity: 1, marginTop: 16 },
            closed: { height: 0, opacity: 0, marginTop: 0 },
          }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full overflow-hidden md:hidden"
        >
          <div className="glass-panel flex flex-col gap-3 p-5">
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/65">Navigate</p>
            {isAuthenticated ? (
              <>
                <Link
                  to="/studio"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white transition hover:border-white/35 hover:text-white"
                >
                  Enter Studio
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-2xl border border-white/12 px-4 py-3 text-sm text-white/80 transition hover:border-white/35 hover:text-white"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth?mode=sign-in"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white transition hover:border-white/35 hover:text-white"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth?mode=sign-up"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-2xl border border-accent-purple/60 bg-accent-purple/20 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-accent-purple/35"
                >
                  Request Access
                </Link>
              </>
            )}
          </div>
        </motion.div>

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
                  to={isAuthenticated ? "/studio" : "/auth?mode=sign-up"}
                  className="accent-gradient flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-glow transition hover:-translate-y-0.5"
                >
                  <Wand2 className="h-4 w-4" />
                  {isAuthenticated ? "Launch Studio" : "Request Access"}
                </Link>
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="group flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white/70 transition hover:border-white/40 hover:text-white"
                  >
                    <AudioLines className="h-4 w-4 transition group-hover:text-accent-cyan" />
                    Sign Out
                  </button>
                ) : (
                  <Link
                    to="/auth?mode=sign-in"
                    className="group flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white/70 transition hover:border-white/40 hover:text-white"
                  >
                    <AudioLines className="h-4 w-4 transition group-hover:text-accent-cyan" />
                    Sign In
                  </Link>
                )}
              </div>
              <div className="grid gap-6 pt-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/65">Workflow</p>
                  <p className="mt-2 font-heading text-xl text-white">Outline → Script → Voice</p>
                  <p className="mt-1 text-xs text-white/65">One continuous flow with review checkpoints.</p>
                </div>
                <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/65">Voice Engine</p>
                  <p className="mt-2 font-heading text-xl text-white">Chirp HD</p>
                  <p className="mt-1 text-xs text-white/65">Neural narration with controllable pacing.</p>
                </div>
                <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/65">Collab Ready</p>
                  <p className="mt-2 font-heading text-xl text-white">Draft Alignment</p>
                  <p className="mt-1 text-xs text-white/65">Blend your outlines with ClipVox guidance.</p>
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
                <p className="text-sm uppercase tracking-[0.45em] text-white/65">Pipeline</p>
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
                        <p className="text-xs uppercase tracking-[0.35em] text-white/65">Status</p>
                        <p className="mt-2 font-heading text-lg text-white">Studio access available</p>
                      </div>
                      <MountainSnow className="h-10 w-10 text-white/55" />
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
              <p className="text-xs uppercase tracking-[0.45em] text-white/65">Use Cases</p>
              <h2 className="mt-2 font-heading text-3xl text-white">How creators use ClipVox</h2>
            </div>
            <div className="flex gap-3">
              <Link
                to={isAuthenticated ? "/studio" : "/auth?mode=sign-up"}
                className="accent-gradient flex items-center gap-2 rounded-full px-5 py-3 text-xs font-semibold uppercase tracking-wide text-white shadow-glow transition hover:-translate-y-0.5"
              >
                {isAuthenticated ? "Launch Studio" : "Request Access"}
              </Link>
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-full border border-white/15 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-white/70 transition hover:border-white/30 hover:text-white"
                >
                  Sign Out
                </button>
              ) : (
                <Link
                  to="/auth?mode=sign-in"
                  className="rounded-full border border-white/15 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-white/70 transition hover:border-white/30 hover:text-white"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-white/65">Documentaries</p>
              <p className="mt-3 font-heading text-lg text-white">Plan long arcs with confidence</p>
              <p className="mt-3 text-sm text-white/65">
                Rapidly sketch act structures, ensure call-backs land, and keep a human voice via guided drafting.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-white/65">Education</p>
              <p className="mt-3 font-heading text-lg text-white">Deliver cohesive lesson series</p>
              <p className="mt-3 text-sm text-white/65">
                Standardize tone and pacing across an entire curriculum while customizing voice for each module.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-white/65">Studios</p>
              <p className="mt-3 font-heading text-lg text-white">Iterate branded scripts quickly</p>
              <p className="mt-3 text-sm text-white/65">
                Import existing drafts, align to updated briefs, and render voice previews for stakeholder reviews.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 bg-black/40 px-6 py-10 text-sm text-white/65 md:px-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-accent-purple" />
            <p className="font-heading text-lg text-white">ClipVox Studio</p>
          </div>
          <div className="flex gap-6 text-xs uppercase tracking-[0.35em] text-white/65">
            {isAuthenticated ? (
              <>
                <Link to="/studio" className="hover:text-white">
                  Studio
                </Link>
                <button type="button" onClick={handleSignOut} className="hover:text-white">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/auth?mode=sign-in" className="hover:text-white">
                  Sign In
                </Link>
                <Link to="/auth?mode=sign-up" className="hover:text-white">
                  Request Access
                </Link>
              </>
            )}
          </div>
          <p>© {new Date().getFullYear()} ClipVox. Build cinematic AI stories.</p>
        </div>
      </footer>
    </div>
  );
}

function AuthPage() {
  const { session, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const resolveAuthMode = (search) => {
    const params = new URLSearchParams(search);
    const candidate = params.get("mode");
    return candidate === "sign-up" ? "sign-up" : "sign-in";
  };
  const [mode, setMode] = useState(() => resolveAuthMode(location.search));
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const activeMode = getModeDetails(mode);
  const modeIds = AUTH_MODES.map((item) => item.id);

  useEffect(() => {
    const nextMode = resolveAuthMode(location.search);
    setMode((prev) => (prev === nextMode ? prev : nextMode));
  }, [location.search]);

  useEffect(() => {
    if (!loading && session) {
      navigate("/studio", { replace: true });
    }
  }, [session, loading, navigate]);

  const updateField = (field) => (event) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.email || !form.password) {
      setError("Please provide both email and password.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "sign-in") {
        await signIn(form.email, form.password);
        navigate("/studio", { replace: true });
      } else {
        const result = await signUp(form.email, form.password);
        if (result.requiresConfirmation) {
          setMessage("Check your inbox to confirm your email before signing in.");
        } else {
          navigate("/studio", { replace: true });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleModeChange = (nextMode) => {
    if (!modeIds.includes(nextMode)) return;
    if (mode === nextMode) return;
    setError("");
    setMessage("");
    setMode(nextMode);
    const params = new URLSearchParams(location.search);
    params.set("mode", nextMode);
    navigate({ pathname: "/auth", search: params.toString() }, { replace: true });
  };

  const handleModeKeyNav = (event, currentIndex) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (currentIndex + delta + modeIds.length) % modeIds.length;
    handleModeChange(modeIds[nextIndex]);
  };

  const handlePasswordReset = async () => {
    setError("");
    setMessage("");
    if (!form.email) {
      setError("Enter your email above before requesting a reset link.");
      return;
    }
    if (!supabase) {
      setError("Password reset is unavailable. Contact support to regain access.");
      return;
    }
    setResettingPassword(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(form.email, {
        redirectTo: `${window.location.origin}/auth?mode=sign-in`,
      });
      if (resetError) throw resetError;
      setMessage("Check your inbox for a password reset link. It expires in 10 minutes.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send password reset email.");
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-800 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-80 blur-3xl" aria-hidden>
        <div className="absolute inset-0 bg-aurora-gradient" />
      </div>

      <header className="relative z-10 border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between md:px-10">
          <Link to="/" className="flex items-center gap-3 text-white">
            <Sparkles className="h-5 w-5 text-accent-purple" />
            <span className="font-heading text-lg">ClipVox Studio</span>
          </Link>
          <div
            role="tablist"
            aria-label="Authentication mode"
            className="flex w-full flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-1 text-sm text-white/70 md:w-auto md:flex-row md:items-center"
          >
            {AUTH_MODES.map((option, index) => {
              const isActive = option.id === mode;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`auth-panel-${option.id}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => handleModeChange(option.id)}
                  onKeyDown={(event) => handleModeKeyNav(event, index)}
                  className={`flex flex-1 flex-col rounded-xl px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-purple ${
                    isActive
                      ? "bg-white text-base-800"
                      : "text-white/70 hover:bg-white/10 hover:text-white focus-visible:bg-white/10"
                  }`}
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.3em]">{option.label}</span>
                  <span className={`mt-1 text-[11px] tracking-[0.2em] ${isActive ? "text-base-800/70" : "text-white/65"}`}>
                    {option.caption}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col justify-center px-6 py-12 md:px-10">
        <div className="glass-panel border border-white/10 p-10" id={`auth-panel-${mode}`}>
          <header className="mb-8 space-y-2 text-center">
            <p className="text-xs uppercase tracking-[0.45em] text-white/65">{activeMode.tag}</p>
            <h1 className="font-heading text-3xl text-white">{activeMode.heading}</h1>
            <p className="text-sm text-white/70">{activeMode.description}</p>
          </header>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            )}
            {message && (
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                {message}
              </div>
            )}

            <label className="block text-sm text-white/60">
              Email
              <input
                type="email"
                value={form.email}
                onChange={updateField("email")}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-accent-purple focus:outline-none focus:ring-2 focus:ring-accent-purple/40"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>

            <label className="block text-sm text-white/60">
              Password
              <input
                type="password"
                value={form.password}
                onChange={updateField("password")}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-accent-purple focus:outline-none focus:ring-2 focus:ring-accent-purple/40"
                placeholder="••••••••"
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                minLength={6}
                required
              />
              <p className="mt-2 text-xs text-white/65">{activeMode.passwordHelper}</p>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="accent-gradient flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-glow transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {activeMode.cta}
            </button>
          </form>

          <footer className="mt-8 space-y-3 text-center text-xs text-white/60">
            <p className="flex flex-col gap-1 text-white/65 sm:flex-row sm:items-center sm:justify-center">
              <span className="text-white/60">Forgot your password?</span>
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={resettingPassword}
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-white transition hover:border-white/40 hover:text-white disabled:opacity-50"
              >
                {resettingPassword ? "Sending..." : "Email reset link"}
              </button>
            </p>
            <p>
              Need to head back?{" "}
              <Link to="/" className="text-white hover:underline">
                Return to landing page
              </Link>
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}

function StudioPage() {
  const { session, loading, signOut } = useAuth();
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
  const modeEntries = Object.entries(STUDIO_MODES);
  const [activeStep, setActiveStep] = useState("brief");
  const currentStudioMode = STUDIO_MODES[mode] ?? STUDIO_MODES.oneshot;
  const activeSegmentData = audioSegments[activeSegment] ?? null;
  const scriptRequested = loadingScript || Boolean(script);
  const currentStepIndex = STUDIO_STEPS.findIndex((step) => step.id === activeStep);
  const maxUnlockedIndex = script ? 2 : scriptRequested ? 1 : 0;
  const safeCurrentIndex = currentStepIndex >= 0 ? currentStepIndex : 0;
  const effectiveProgressIndex = Math.max(safeCurrentIndex, maxUnlockedIndex);
  const clampedProgressIndex = Math.min(STUDIO_STEPS.length - 1, effectiveProgressIndex);
  const stepProgressPercent =
    STUDIO_STEPS.length > 1 ? (clampedProgressIndex / (STUDIO_STEPS.length - 1)) * 100 : 100;
  const canAccessVoiceStep = Boolean(script);

  const chapterDuration = useMemo(() => {
    if (!form.length || !form.chapters) return "—";
    const minutes = Number(form.length);
    const chapters = Number(form.chapters);
    if (Number.isNaN(minutes) || Number.isNaN(chapters) || chapters <= 0) return "—";
    const perChapter = minutes / chapters;
    return `${perChapter.toFixed(1)} min / chapter`;
  }, [form.length, form.chapters]);
  const scriptSections = useMemo(() => parseScriptSections(script), [script]);

  useEffect(() => {
    return () => {
      audioSegments.forEach((segment) => URL.revokeObjectURL(segment.url));
    };
  }, [audioSegments]);

  useEffect(() => {
    if (safeCurrentIndex > maxUnlockedIndex) {
      const fallbackStep = STUDIO_STEPS[maxUnlockedIndex]?.id ?? STUDIO_STEPS[0].id;
      setActiveStep(fallbackStep);
    }
  }, [safeCurrentIndex, maxUnlockedIndex]);

  const accessToken = session?.access_token ?? "";
  const isAuthenticated = Boolean(session);

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
    setActiveStep("script");
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      if (res.status === 401) {
        await handleStudioSignOut();
        throw new Error("Your session expired. Please sign in again.");
      }
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
    setActiveStep("voice");
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.status === 401) {
        await handleStudioSignOut();
        throw new Error("Your session expired. Please sign in again.");
      }
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

      const extension =
        payload.audioEncoding === "MP3" ? "mp3" : payload.audioEncoding === "OGG_OPUS" ? "ogg" : "wav";
      const newSegments = segmentsData.map((segment, idx) => {
        const audioBytes = Uint8Array.from(atob(segment.audioContent), (c) => c.charCodeAt(0));
        const blob = new Blob([audioBytes.buffer], { type: mime });
        const fileName = `clipvox-segment-${idx + 1}.${extension}`;
        return {
          index: idx,
          text: segment.text,
          url: URL.createObjectURL(blob),
          blob,
          fileName,
        };
      });

      const durations = await Promise.all(newSegments.map((segment) => getAudioDuration(segment.url)));
      const segmentsWithMetadata = newSegments.map((segment, idx) => ({
        ...segment,
        duration: durations[idx],
      }));

      setAudioSegments(segmentsWithMetadata);
      setActiveSegment(0);
      if (data.exceededLimit) {
        setVoiceMessage(
          `Script exceeded the single-request limit. Audio was split into ${segmentsWithMetadata.length} segments.`
        );
      } else if (segmentsWithMetadata.length > 1) {
        setVoiceMessage(`Audio delivered in ${segmentsWithMetadata.length} segments. Play or download each in order.`);
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

  const handleExportScript = () => {
    if (!script) return;
    const blob = new Blob([script], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const filename = `${slugify(form.topic || "clipvox-script")}.txt`;
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleVoiceFormSubmit = (event) => {
    event.preventDefault();
    handleGenerateVoice();
  };

  const handleDownloadAllSegments = async () => {
    if (audioSegments.length === 0) return;
    try {
      const archive = new JSZip();
      audioSegments.forEach((segment) => {
        if (segment.blob) {
          archive.file(segment.fileName, segment.blob);
        }
      });
      const zipBlob = await archive.generateAsync({ type: "blob" });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const anchor = document.createElement("a");
      const baseName = slugify(form.topic || "clipvox-voice");
      anchor.href = downloadUrl;
      anchor.download = `${baseName}-segments.zip`;
      anchor.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError("Unable to bundle audio segments for download. Try saving them individually.");
    }
  };

  const handleStudioSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error("Failed to sign out", err);
      setError("Unable to sign out. Please refresh and try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-800 text-white">
        <div className="glass-panel border border-white/10 px-6 py-4 text-sm text-white/70">
          Checking your session...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth?mode=sign-in" replace />;
  }

  return (
    <div className="min-h-screen bg-base-800 text-white">
      <header className="border-b border-white/10 bg-black/45 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 md:px-10">
          <Link to="/" className="flex items-center gap-3 text-white transition hover:text-accent-cyan">
            <Sparkles className="h-5 w-5 text-accent-purple" />
            <span className="font-heading text-lg">ClipVox Studio</span>
          </Link>
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/70">
            <span className="hidden sm:inline-flex items-center gap-1 text-white/60">
              <Bot className="h-3.5 w-3.5 text-accent-cyan" />
              Narrative workspace
            </span>
            <button
              type="button"
              onClick={handleStudioSignOut}
              className="rounded-full border border-white/15 px-4 py-2 text-white/75 transition hover:border-white/35 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>


      <main className="mx-auto w-full max-w-6xl px-6 py-10 md:px-10">
        {error && (
          <div className="mb-6 glass-panel border border-red-400/30 bg-red-500/10 px-6 py-4 text-sm text-red-100">
            {error}
          </div>
        )}

        <section className="space-y-6">
          <div className="glass-panel border border-white/10 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/65">Production Flow</p>
                <h2 className="mt-2 font-heading text-2xl text-white">Narrative Studio</h2>
                <p className="mt-2 text-sm text-white/70">
                  Move from creative brief to finished voiceover with guided checkpoints and responsive feedback.
                </p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.3em] text-white/70">
                Mode · {currentStudioMode.label}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {STUDIO_STEPS.map((step, index) => {
                const isActive = step.id === activeStep;
                const isComplete = index < maxUnlockedIndex;
                const isUnlocked = index <= maxUnlockedIndex;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => {
                      if (isUnlocked) setActiveStep(step.id);
                    }}
                    disabled={!isUnlocked}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                      isActive
                        ? "border-accent-cyan/60 bg-accent-cyan/15 text-white shadow-glow"
                        : isComplete
                        ? "border-accent-purple/50 bg-accent-purple/15 text-white"
                        : "border-white/12 bg-white/[0.02] text-white/60"
                    } ${isUnlocked ? "hover:border-white/25 hover:text-white" : "cursor-not-allowed opacity-40"}`}
                    aria-current={isActive ? "step" : undefined}
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                        isComplete
                          ? "bg-accent-purple text-white"
                          : isActive
                          ? "border border-accent-cyan text-white"
                          : "border border-white/20 text-white/70"
                      }`}
                    >
                      {isComplete ? <Check className="h-4 w-4" /> : index + 1}
                    </span>
                    <span className="flex flex-col">
                      <span className="text-xs uppercase tracking-[0.35em]">{step.label}</span>
                      <span className="mt-1 text-[11px] text-white/65">{step.summary}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 h-1 w-full rounded-full bg-white/10">
              <motion.div
                className="h-1 rounded-full bg-gradient-to-r from-accent-purple via-accent-cyan to-accent-pink"
                style={{ width: `${stepProgressPercent}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </div>

          <div className="glass-panel border border-white/10 p-8">
            {activeStep === "brief" && (
              <form className="space-y-8" onSubmit={handleGenerateScript}>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/65">Narrative Mode</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {modeEntries.map(([id, details]) => {
                      const selected = mode === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setMode(id)}
                          className={`group rounded-2xl border px-4 py-4 text-left transition ${
                            selected
                              ? "border-accent-cyan/60 bg-accent-cyan/15 text-white shadow-glow"
                              : "border-white/12 bg-white/[0.02] text-white/70 hover:border-white/30 hover:text-white"
                          }`}
                        >
                          <span className="text-xs uppercase tracking-[0.35em]">{details.label}</span>
                          <p className="mt-2 text-sm text-white/70">{details.description}</p>
                          {selected && (
                            <span className="mt-3 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-accent-cyan">
                              <Check className="h-3.5 w-3.5" /> Selected
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr),280px]">
                  <div className="grid gap-7">
                    <label className="block text-sm text-white/70">
                      Topic
                      <input
                        type="text"
                        name="topic"
                        value={form.topic}
                        onChange={(e) => updateField("topic", e.target.value)}
                        placeholder="e.g. The untold history of the Silk Road"
                        className="mt-2 w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-cyan/40"
                        required
                      />
                    </label>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-white/65">Tone</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {toneOptions.map((option) => {
                            const selected = form.tone === option;
                            return (
                              <button
                                key={option}
                                type="button"
                                onClick={() => updateField("tone", option)}
                                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                                  selected
                                    ? "bg-gradient-to-r from-accent-purple to-accent-cyan text-base-900 shadow-glow"
                                    : "border border-white/15 bg-white/[0.02] text-white/70 hover:border-white/35 hover:text-white"
                                }`}
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-white/65">Style</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {styleOptions.map((option) => {
                            const selected = form.style === option;
                            return (
                              <button
                                key={option}
                                type="button"
                                onClick={() => updateField("style", option)}
                                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                                  selected
                                    ? "bg-gradient-to-r from-accent-purple to-accent-cyan text-base-900 shadow-glow"
                                    : "border border-white/15 bg-white/[0.02] text-white/70 hover:border-white/35 hover:text-white"
                                }`}
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <label className="block text-sm text-white/70">
                        <span className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-white/65">
                          Length
                          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.35em] text-white/80">
                            {form.length} min
                          </span>
                        </span>
                        <input
                          type="range"
                          min="3"
                          max="60"
                          step="1"
                          value={Number(form.length) || 3}
                          onChange={(e) => updateField("length", Number(e.target.value))}
                          className="studio-slider mt-4"
                        />
                        <div className="mt-2 flex justify-between text-[10px] uppercase tracking-[0.3em] text-white/50">
                          <span>3 min</span>
                          <span>60 min</span>
                        </div>
                      </label>
                      <label className="block text-sm text-white/70">
                        <span className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-white/65">
                          Chapters
                          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.35em] text-white/80">
                            {form.chapters}
                          </span>
                        </span>
                        <input
                          type="range"
                          min="1"
                          max="20"
                          step="1"
                          value={Number(form.chapters) || 1}
                          onChange={(e) => updateField("chapters", Number(e.target.value))}
                          className="studio-slider mt-4"
                        />
                        <div className="mt-2 flex justify-between text-[10px] uppercase tracking-[0.3em] text-white/50">
                          <span>1</span>
                          <span>20</span>
                        </div>
                      </label>
                    </div>

                    {mode === "craft" && (
                      <label className="block text-sm text-white/70">
                        Guided draft input
                        <textarea
                          name="draft"
                          value={form.draft}
                          onChange={(e) => updateField("draft", e.target.value)}
                          placeholder="Paste your outline, script beats, or draft paragraphs..."
                          className="mt-2 w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-cyan/40"
                          rows={6}
                        />
                        <p className="mt-2 text-xs text-white/70">
                          Blend your existing structure with ClipVox narration. Keep paragraphs short for best alignment.
                        </p>
                      </label>
                    )}
                  </div>

                  <aside className="rounded-3xl border border-white/10 bg-white/[0.05] p-5">
                    <p className="text-xs uppercase tracking-[0.35em] text-white/70">Production Notes</p>
                    <p className="mt-3 text-sm text-white/75">
                      Targeting a {form.length || defaultForm.length}-minute runtime across {form.chapters || defaultForm.chapters} chapters
                      with a {form.tone.toLowerCase()} tone and {form.style.toLowerCase()} delivery.
                    </p>
                    <div className="mt-4 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-xs uppercase tracking-[0.3em] text-white/80">
                      Chapter pacing · {chapterDuration}
                    </div>
                    <p className="mt-4 text-xs text-white/70">
                      Guided mode keeps your structure intact while enhancing transitions and narrative glue.
                    </p>
                  </aside>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-white/70">Step 1 of 3 · Configure your brief and launch the script engine.</p>
                  <button
                    type="submit"
                    disabled={loadingScript}
                    className="accent-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-glow transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loadingScript ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    {loadingScript ? "Generating narrative" : "Generate narrative"}
                  </button>
                </div>
              </form>
            )}

            {activeStep === "script" && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-white/65">Step 2 · Script generation</p>
                    <h3 className="mt-2 font-heading text-2xl text-white">Your Script</h3>
                    <p className="mt-2 text-sm text-white/70">
                      Expand each section to reveal the full draft, make any edits, or move straight into voice rendering.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveStep("brief")}
                      className="rounded-full border border-white/12 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70 transition hover:border-white/30 hover:text-white"
                    >
                      Edit Brief
                    </button>
                    <button
                      type="button"
                      onClick={() => canAccessVoiceStep && setActiveStep("voice")}
                      disabled={!canAccessVoiceStep}
                      className="rounded-full border border-accent-cyan/60 bg-accent-cyan/15 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Open Voice Studio
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCopy}
                      disabled={!script || loadingScript}
                      className="rounded-full border border-white/12 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {copied ? "Copied" : "Copy"}
                    </button>
                    <button
                      type="button"
                      onClick={handleExportScript}
                      disabled={!script || loadingScript}
                      className="rounded-full border border-white/12 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Export
                    </button>
                  </div>
                  <span className="text-xs uppercase tracking-[0.3em] text-white/60">
                    Draft length · {script ? `${script.length.toLocaleString()} chars` : "—"}
                  </span>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/30 p-6">
                  {loadingScript && (
                    <div className="flex min-h-[260px] flex-col items-center justify-center gap-4 text-white/70">
                      <Loader2 className="h-10 w-10 animate-spin text-accent-purple" />
                      <p>Sequencing outline, chapters, and narrative flow...</p>
                    </div>
                  )}

                  {!loadingScript && script && (
                    <div className="space-y-3">
                      {scriptSections.map((section, index) => (
                        <details
                          key={`${section.title}-${index}`}
                          className="group rounded-2xl border border-white/12 bg-white/[0.03] p-4 transition hover:border-white/30"
                          open={index === 0}
                        >
                        <summary className="flex cursor-pointer items-center justify-between gap-4 text-left text-sm text-white/80 transition hover:text-white [&::-webkit-details-marker]:hidden">
                          <div className="flex flex-col gap-1">
                            <span className="font-heading text-lg text-white">{section.title}</span>
                            <span className="text-[11px] uppercase tracking-[0.35em] text-white/65">Section {index + 1}</span>
                          </div>
                          <ChevronDown className="h-4 w-4 text-white/60 transition duration-200 group-open:rotate-180" />
                        </summary>
                          <div className="mt-3 space-y-3 text-sm leading-relaxed text-white/80">
                            {section.content.map((paragraph, paragraphIndex) => (
                              <p key={paragraphIndex}>{paragraph}</p>
                            ))}
                          </div>
                        </details>
                      ))}
                    </div>
                  )}

                  {!loadingScript && !script && (
                    <div className="flex min-h-[200px] items-center justify-center text-sm text-white/60">
                      Configure your brief in Step 1 to generate a narrative draft.
                    </div>
                  )}
                </div>

                {scriptMeta && (
                  <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-xs text-white/70 sm:grid-cols-2 lg:grid-cols-4">
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
            )}

            {activeStep === "voice" && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-white/65">Step 3 · Voice rendering</p>
                    <h3 className="mt-2 font-heading text-2xl text-white">Audio Stage</h3>
                    <p className="mt-2 text-sm text-white/70">
                      Tune the settings, render the performance, and download polished audio segments.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveStep("script")}
                    className="rounded-full border border-white/12 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70 transition hover:border-white/30 hover:text-white"
                  >
                    Back to Script
                  </button>
                </div>

                {!canAccessVoiceStep && (
                  <div className="rounded-3xl border border-white/10 bg-black/30 p-6 text-sm text-white/65">
                    Generate a script in the previous step to unlock voice rendering controls.
                  </div>
                )}

                {canAccessVoiceStep && (
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),0.85fr]">
                    <form onSubmit={handleVoiceFormSubmit} className="space-y-5 rounded-3xl border border-white/10 bg-black/30 p-6">
                      <div className="grid gap-4">
                        <label className="text-xs uppercase tracking-[0.3em] text-white/70">
                          Voice persona
                          <select
                            name="voiceName"
                            value={form.voiceName}
                            onChange={(e) => updateField("voiceName", e.target.value)}
                            className="mt-2 w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white focus:border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-cyan/40"
                          >
                            {voicePresets.map((preset) => (
                              <option key={preset.value} value={preset.value} className="bg-base-800 text-white">
                                {preset.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="text-xs uppercase tracking-[0.3em] text-white/70">
                          Speaking rate
                          <input
                            type="number"
                            step="0.1"
                            min="0.5"
                            max="1.5"
                            value={form.speakingRate}
                            onChange={(e) => updateField("speakingRate", e.target.value)}
                            className="mt-2 w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white focus:border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-cyan/40"
                          />
                        </label>
                        <label className="text-xs uppercase tracking-[0.3em] text-white/70">
                          Pitch
                          <input
                            type="number"
                            step="0.1"
                            min="-10"
                            max="10"
                            value={form.pitch}
                            onChange={(e) => updateField("pitch", e.target.value)}
                            className="mt-2 w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white focus:border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-cyan/40"
                          />
                        </label>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="text-xs uppercase tracking-[0.3em] text-white/70">
                          Audio encoding
                          <select
                            name="audioEncoding"
                            value={form.audioEncoding}
                            onChange={(e) => updateField("audioEncoding", e.target.value)}
                            className="mt-2 w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white focus:border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-cyan/40"
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
                        <label className="text-xs uppercase tracking-[0.3em] text-white/70">
                          Model
                          <input
                            type="text"
                            name="modelName"
                            value={form.modelName}
                            onChange={(e) => updateField("modelName", e.target.value)}
                            className="mt-2 w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white focus:border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-cyan/40"
                          />
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={loadingVoice}
                        className="accent-gradient inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-glow transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loadingVoice ? <Loader2 className="h-4 w-4 animate-spin" /> : <AudioLines className="h-4 w-4" />}
                        {loadingVoice ? "Rendering voice" : "Render voice"}
                      </button>
                      <p className="text-xs text-white/65">
                        Rendering happens in the background. Longer scripts may deliver multiple segments.
                      </p>
                    </form>

                    <div className="space-y-4 rounded-3xl border border-white/10 bg-black/30 p-6">
                      {loadingVoice && (
                        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-white/70">
                          <Loader2 className="h-8 w-8 animate-spin text-accent-cyan" />
                          <p>Rendering voice with Google Chirp...</p>
                        </div>
                      )}

                      {!loadingVoice && audioSegments.length > 0 && (
                        <>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-xs uppercase tracking-[0.35em] text-white/65">
                                Preview segment {activeSegment + 1} / {audioSegments.length}
                              </p>
                              <p className="text-[11px] uppercase tracking-[0.25em] text-white/60">
                                Duration · {formatDuration(activeSegmentData?.duration)}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-white/15 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-white/70">
                                {form.audioEncoding}
                              </span>
                              <button
                                type="button"
                                onClick={handleDownloadAllSegments}
                                disabled={audioSegments.length === 0}
                                className="rounded-full border border-white/15 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-white/70 transition hover:border-white/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Download all
                              </button>
                            </div>
                          </div>
                          <audio key={activeSegmentData?.url} src={activeSegmentData?.url} controls className="mt-3 w-full" />
                          {voiceMessage && <p className="text-xs text-accent-cyan/90">{voiceMessage}</p>}
                          <div className="space-y-2">
                            <p className="text-[10px] uppercase tracking-[0.35em] text-white/65">Segments</p>
                            <div className="flex flex-col gap-2">
                              {audioSegments.map((segment, idx) => {
                                const label = segment.text.replace(/\s+/g, " ").slice(0, 80);
                                const durationLabel = formatDuration(segment.duration);
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
                                      onClick={() => setActiveSegment(idx)}
                                      className="flex-1 text-left"
                                    >
                                      Segment {idx + 1}: {label}
                                      {segment.text.length > 80 ? "..." : ""}
                                    </button>
                                    <div className="ml-3 flex items-center gap-2">
                                      <span className="text-[10px] uppercase tracking-[0.3em] text-white/60">{durationLabel}</span>
                                      <a
                                        href={segment.url}
                                        download={segment.fileName}
                                        className="rounded-full border border-white/15 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-white/70 transition hover:border-white/35 hover:text-white"
                                      >
                                        Save
                                      </a>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      )}

                      {!loadingVoice && audioSegments.length === 0 && (
                        <div className="flex min-h-[200px] flex-col items-center justify-center text-sm text-white/60">
                          Run the voice engine to receive downloadable segments.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black/35 px-6 py-8 text-xs text-white/65 md:px-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="uppercase tracking-[0.35em]">© {new Date().getFullYear()} ClipVox Studio</p>
          <div className="flex gap-5 uppercase tracking-[0.35em]">
            <Link to="/" className="hover:text-white">
              Landing
            </Link>
            <button type="button" onClick={handleStudioSignOut} className="hover:text-white">
              Sign Out
            </button>
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
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/studio" element={<StudioPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
