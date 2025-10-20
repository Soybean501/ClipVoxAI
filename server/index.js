import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import { GoogleAuth } from "google-auth-library";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_DIST = path.resolve(__dirname, "../web/dist");

const app = express();
const openAIApiKey = process.env.OPENAI_API_KEY;
if (!openAIApiKey) {
  console.error("Missing OPENAI_API_KEY. Set it before starting the server.");
  process.exit(1);
}

const client = new OpenAI({ apiKey: openAIApiKey });

app.use(express.json());
app.use(express.static(CLIENT_DIST));

const WORDS_PER_MINUTE = 130;
const GOOGLE_TTS_ENDPOINT = "https://texttospeech.googleapis.com/v1beta1/text:synthesize";
const GOOGLE_TTS_SCOPES = ["https://www.googleapis.com/auth/cloud-platform"];
const RETRYABLE_TTS_STATUS = new Set([408, 429, 500, 502, 503, 504]);
const MAX_TTS_ATTEMPTS = 3;
const TTS_BYTE_LIMIT = 5000;
const TTS_SAFE_BYTE_LIMIT = 4500;
let googleAuthClientPromise;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function splitTextIntoChunks(text, byteLimit = TTS_SAFE_BYTE_LIMIT) {
  const result = [];
  const paragraphs = text.split(/\n{2,}/g);
  let current = "";

  const pushCurrent = () => {
    if (current && current.trim().length) {
      result.push(current.trim());
      current = "";
    }
  };

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    if (!trimmedParagraph) continue;

    const candidate = current ? `${current}\n\n${trimmedParagraph}` : trimmedParagraph;
    if (Buffer.byteLength(candidate, "utf8") <= byteLimit) {
      current = candidate;
      continue;
    }

    pushCurrent();

    if (Buffer.byteLength(trimmedParagraph, "utf8") <= byteLimit) {
      current = trimmedParagraph;
      continue;
    }

    let sliceStart = 0;
    const paragraphLength = trimmedParagraph.length;

    while (sliceStart < paragraphLength) {
      let sliceEnd = sliceStart;
      while (
        sliceEnd <= paragraphLength &&
        Buffer.byteLength(trimmedParagraph.slice(sliceStart, sliceEnd), "utf8") <= byteLimit
      ) {
        sliceEnd += 1;
      }

      if (sliceEnd === sliceStart) {
        sliceEnd = Math.min(sliceStart + byteLimit, paragraphLength);
      } else {
        sliceEnd -= 1;
      }

      const chunk = trimmedParagraph.slice(sliceStart, sliceEnd).trim();
      if (chunk) {
        result.push(chunk);
      }
      sliceStart = sliceEnd;
    }
  }

  pushCurrent();
  return result;
}

function parseGoogleCredentials(raw) {
  if (!raw) return null;
  try {
    const trimmed = raw.trim();
    const jsonString =
      trimmed.startsWith("{") ? trimmed : Buffer.from(trimmed, "base64").toString("utf8");
    return JSON.parse(jsonString);
  } catch (err) {
    throw new Error("Invalid GOOGLE_TTS_CREDENTIALS value. Expecting JSON or base64-encoded JSON.");
  }
}

async function getGoogleAuthClient() {
  if (!googleAuthClientPromise) {
    const credentialEnv = process.env.GOOGLE_TTS_CREDENTIALS;
    if (credentialEnv) {
      const credentials = parseGoogleCredentials(credentialEnv);
      const auth = new GoogleAuth({
        credentials,
        scopes: GOOGLE_TTS_SCOPES,
      });
      googleAuthClientPromise = auth.getClient();
    } else {
      const auth = new GoogleAuth({
        scopes: GOOGLE_TTS_SCOPES,
      });
      googleAuthClientPromise = auth.getClient();
    }
  }
  return googleAuthClientPromise;
}

async function generateOutline({ topic, tone, style, scriptLength, chapterCount, draft }) {
  const outlinePrompt = `
  Craft a detailed outline for a YouTube video script.
  Topic: ${topic}
  Tone: ${tone || "neutral"}
  Style: ${style || "informative"}
  Target length: ${scriptLength} minutes.
  Required chapters: exactly ${chapterCount}.
  ${draft ? `Incorporate the essence and key beats from the user's draft:\n"""${draft}"""` : ""}

  Provide compelling chapter titles and one-sentence summaries that cover the full story arc.

  Return valid JSON only:
  {
    "title": "string",
    "chapters": [
      { "title": "string", "summary": "string" }
    ]
  }
  `;

  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You specialize in outlining structured, engaging long-form video scripts." },
      { role: "user", content: outlinePrompt },
    ],
    temperature: 0.6,
    max_tokens: 1500,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("No outline returned");

  const parsed = JSON.parse(raw);
  if (!parsed.title || !Array.isArray(parsed.chapters) || parsed.chapters.length === 0) {
    throw new Error("Outline missing required fields");
  }

  let chapters = parsed.chapters.slice(0, chapterCount);
  if (chapters.length < chapterCount) {
    const last = chapters[chapters.length - 1] || { title: "Continuation", summary: "Continue the story." };
    while (chapters.length < chapterCount) {
      chapters.push({ ...last });
    }
  }

  return {
    title: String(parsed.title).trim(),
    chapters: chapters.map((chapter, idx) => ({
      title: String(chapter.title || `Chapter ${idx + 1}`).trim(),
      summary: String(chapter.summary || "Continue the narrative.").trim(),
    })),
  };
}

async function generateChapterSection({
  topic,
  tone,
  style,
  scriptLength,
  chapterCount,
  chapterIndex,
  chapterPlan,
  previousSummaries,
  draft,
}) {
  const totalWords = Math.max(WORDS_PER_MINUTE, Math.round(scriptLength * WORDS_PER_MINUTE));
  const chapterGoal = Math.max(180, Math.round(totalWords / chapterCount));
  const previousContext =
    previousSummaries.length === 0
      ? "No chapters have been written yet. Set the scene naturally."
      : previousSummaries
          .map(
            (prev, idx) =>
              `Chapter ${idx + 1}: ${prev.title} -> ${prev.summary}`
          )
          .join("\n");

  const chapterPrompt = `
  You are writing Chapter ${chapterIndex + 1} of ${chapterCount} for a YouTube narration script.
  Topic: ${topic}
  Tone: ${tone || "neutral"}
  Style: ${style || "informative"}
  Total target length: ${scriptLength} minutes.
  Target words for this chapter: about ${chapterGoal} words.

  Outline focus for this chapter:
  Title: ${chapterPlan.title}
  Summary: ${chapterPlan.summary}

  Chapters already completed:
  ${previousContext}

  ${draft ? `User draft reference (use it to align style and key ideas):\n"""${draft}"""` : "No user draft provided for this project."}

  Write the narration for this chapter in fluent, natural spoken English.
  Requirements:
  - Stay consistent with earlier chapters and the provided outline.
  - Keep the tone and style aligned with the brief.
  - Deliver vivid detail without padding or repetition.
  - Output only the narration paragraphs — no headings, numbering, or labels.

  After writing, create a single-sentence summary capturing the chapter's key development.

  Return valid JSON only:
  {
    "body": "chapter narration text",
    "summary": "single sentence chapter summary"
  }
  `;

  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You craft compelling, structured long-form narration and can summarize crisply." },
      { role: "user", content: chapterPrompt },
    ],
    temperature: 0.7,
    max_tokens: 2000,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error(`No content returned for chapter ${chapterIndex + 1}`);
  const parsed = JSON.parse(raw);
  if (!parsed.body) throw new Error(`Chapter ${chapterIndex + 1} missing body`);

  return {
    body: String(parsed.body).trim(),
    summary: String(parsed.summary || chapterPlan.summary).trim(),
  };
}

async function generateStructuredScript({ topic, tone, style, scriptLength, chapterCount, draft }) {
  const outline = await generateOutline({ topic, tone, style, scriptLength, chapterCount, draft });
  const sections = [outline.title];
  const previousSummaries = [];

  for (let i = 0; i < outline.chapters.length; i += 1) {
    const chapterPlan = outline.chapters[i];
    const { body, summary } = await generateChapterSection({
      topic,
      tone,
      style,
      scriptLength,
      chapterCount: outline.chapters.length,
      chapterIndex: i,
      chapterPlan,
      previousSummaries,
      draft,
    });

    sections.push(`Chapter ${i + 1}: ${chapterPlan.title}\n${body}`);
    previousSummaries.push({ title: chapterPlan.title, summary });
  }

  return sections.join("\n\n");
}

async function synthesizeSpeech({
  text,
  audioEncoding,
  speakingRate,
  pitch,
  languageCode,
  voiceName,
  modelName,
}) {
  const chunks = splitTextIntoChunks(text, TTS_SAFE_BYTE_LIMIT);
  if (chunks.length === 0) {
    throw new Error("No text provided for synthesis");
  }

  const basePayload = {
    audioConfig: {
      audioEncoding: audioEncoding || "LINEAR16",
      speakingRate: typeof speakingRate === "number" ? speakingRate : 1,
      pitch: typeof pitch === "number" ? pitch : 0,
    },
    voice: {
      languageCode: languageCode || "en-US",
      name: voiceName || "en-US-Chirp-HD-F",
    },
  };

  if (modelName) {
    basePayload.voice.modelName = modelName;
  }

  const client = await getGoogleAuthClient();
  const authHeaders = await client.getRequestHeaders();

  const segments = [];

  for (let i = 0; i < chunks.length; i += 1) {
    const chunkText = chunks[i];
    let lastErrorText = "";

    for (let attempt = 1; attempt <= MAX_TTS_ATTEMPTS; attempt += 1) {
      const response = await fetch(GOOGLE_TTS_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          ...basePayload,
          input: {
            text: chunkText,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (!data.audioContent) {
          throw new Error("Google TTS response missing audioContent");
        }
        segments.push({
          index: i,
          text: chunkText,
          audioContent: data.audioContent,
        });
        break;
      }

      lastErrorText = await response.text();
      if (!RETRYABLE_TTS_STATUS.has(response.status) || attempt === MAX_TTS_ATTEMPTS) {
        throw new Error(`Google TTS failed (${response.status}): ${lastErrorText}`);
      }

      const backoff = 500 * attempt;
      await sleep(backoff);
    }
  }

  return {
    segments,
    totalSegments: segments.length,
    audioEncoding: basePayload.audioConfig.audioEncoding,
    voice: basePayload.voice,
    exceededLimit: Buffer.byteLength(text, "utf8") > TTS_BYTE_LIMIT,
  };
}

app.post("/generate", async (req, res) => {
  const { topic, tone, style, length, chapters, mode = "oneshot", draft } = req.body;
  if (!topic) return res.status(400).type("text/plain").send("Missing topic");

  const minutes = Number(length);
  const scriptLength = Number.isFinite(minutes) && minutes > 0 ? minutes : 5;
  const chapterCountRaw = Number(chapters);
  const chapterCount =
    Number.isFinite(chapterCountRaw) && chapterCountRaw > 0 ? Math.round(chapterCountRaw) : 5;

  try {
    if (mode === "craft" && (!draft || !String(draft).trim())) {
      return res.status(400).type("text/plain").send("Draft is required for craft mode");
    }

    const script = await generateStructuredScript({
      topic,
      tone,
      style,
      scriptLength,
      chapterCount,
      draft: mode === "craft" ? String(draft) : undefined,
    });

    res.type("text/plain").send(script.trim());
  } catch (err) {
    console.error("Error generating script:", err);
    res.status(500).type("text/plain").send("Generation failed");
  }
});

app.post("/voice", async (req, res) => {
  try {
    const {
      text,
      audioEncoding = "LINEAR16",
      speakingRate = 1,
      pitch = 0,
      languageCode = "en-US",
      voiceName = "en-US-Chirp-HD-F",
      modelName = "chirp",
    } = req.body || {};

    if (!text || !String(text).trim()) {
      return res.status(400).json({ error: "Missing text for synthesis" });
    }

    const synthesis = await synthesizeSpeech({
      text: String(text),
      audioEncoding,
      speakingRate: Number(speakingRate),
      pitch: Number(pitch),
      languageCode,
      voiceName,
      modelName,
    });

    res.json({
      segments: synthesis.segments,
      audioEncoding: synthesis.audioEncoding,
      voice: synthesis.voice,
      exceededLimit: synthesis.exceededLimit,
    });
  } catch (err) {
    console.error("Voice synthesis failed:", err);
    const message = err instanceof Error ? err.message : "Voice synthesis failed";
    if (message.includes("invalid_grant")) {
      return res.status(401).json({
        error:
          "Voice synthesis failed: authentication error (invalid_grant). Refresh your Google Cloud ADC credentials or provide a service-account JSON via GOOGLE_TTS_CREDENTIALS.",
      });
    }
    res.status(502).json({ error: message });
  }
});

app.get("/healthz", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

app.get("*", (req, res, next) => {
  if (req.method !== "GET") return next();
  if (req.path.startsWith("/generate") || req.path.startsWith("/voice")) return next();
  const indexPath = path.join(CLIENT_DIST, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("Client build not found. Run `npm run build:client` first.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
