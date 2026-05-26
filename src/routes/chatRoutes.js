const express = require("express");
const router = express.Router();

const OpenAI = require("openai");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const path = require("path");
const fs = require("fs");
const pdfParse = require("pdf-parse");

const { sanitizeString } = require("../utils/security");
const { Job, User, Company, Application } = require("../models");

/* 
   OPENROUTER AI SETUP
 */

let aiClient = null;

if (process.env.OPENROUTER_API_KEY) {
  aiClient = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "http://localhost:5000",
      "X-Title": "Smart Job",
    },
  });
}

const AI_MODEL = process.env.OPENROUTER_MODEL || "meta-llama/llama-3-8b-instruct";

/*
   CLEANING
*/

function cleanText(value = "") {
  return sanitizeString(String(value || "")).trim();
}

/* =========================
   INTENT DETECTION
========================= */

function isGreeting(message = "") {
  const m = message.toLowerCase().trim();
  return ["hi", "hello", "hey", "namaste"].includes(m);
}

function isCapabilityQuestion(message = "") {
  const m = message.toLowerCase();
  return (
    m.includes("what can you do") ||
    m.includes("how can you help") ||
    m.includes("features")
  );
}

/* =========================
   ⭐ NEW: GENERAL SMART INTENT
========================= */

function isGeneralConversation(message = "") {
  const m = message.toLowerCase();

  return (
    m.includes("what is my name") ||
    m.includes("tell me my name") ||
    m.includes("who am i") ||
    m.includes("my name") ||
    m.includes("help") ||
    m.includes("talk to me") ||
    m.includes("are you there") ||
    m.includes("hi") ||
    m.includes("hello") ||
    m.includes("hey")
  );
}

function smartGeneralReply(message, user) {
  const m = message.toLowerCase();

  if (m.includes("my name")) {
    return user?.name
      ? `Your name is ${user.name}.`
      : "I don’t have your name saved yet.";
  }

  if (m.includes("what can you do")) {
    return "I can help you find jobs, apply with resumes, track applications, and improve your profile.";
  }

  if (isGreeting(message)) {
    return "Hello! 👋 I’m SmartBot. Ask me about jobs or your profile.";
  }

  return null;
}

/* =========================
   JOB SEARCH INTENT
========================= */

function isJobSearchQuestion(message = "") {
  const m = message.toLowerCase();

  return (
    m.includes("job") ||
    m.includes("career") ||
    m.includes("developer") ||
    m.includes("engineer") ||
    m.includes("react") ||
    m.includes("node") ||
    m.includes("python") ||
    m.includes("java") ||
    m.includes("remote")
  );
}

/* =========================
   JWT USER
========================= */

function getUserIdFromToken(req) {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id;
  } catch {
    return null;
  }
}

async function getLoggedUser(req) {
  const userId = getUserIdFromToken(req);
  if (!userId) return null;

  return User.findByPk(userId, {
    attributes: ["id", "name", "role", "skills", "bio", "overview"],
    include: [
      {
        model: Company,
        as: "company",
        attributes: ["name"],
        required: false,
      },
    ],
  });
}

/* =========================
   JOB FETCH
========================= */

async function getRecentOpenJobs() {
  return Job.findAll({
    where: { status: "open" },
    limit: 5,
    order: [["createdAt", "DESC"]],
  });
}

/* =========================
   FORMATTERS
========================= */

function formatJobs(jobs = []) {
  if (!jobs.length) return "No jobs found.";

  return jobs
    .map(
      (j, i) => `
${i + 1}. ${j.title} - ${j.location || "N/A"}
`
    )
    .join("\n");
}

function formatUser(user) {
  if (!user) return "Guest user";

  return `
Name: ${user.name}
Role: ${user.role}
Skills: ${user.skills || "N/A"}
`;
}

/* =========================
   FALLBACK
========================= */

function localFallback(message = "", jobs = []) {
  const m = message.toLowerCase();

  if (isGreeting(message)) return "Hello! How can I help you?";

  if (isJobSearchQuestion(message)) {
    if (!jobs.length) return "No jobs found right now.";
    return "Here are jobs:\n" + jobs.slice(0, 3).map(j => j.title).join("\n");
  }

  return "I can help you with jobs, applications, resumes, and profiles.";
}

/* =========================
   PROMPT
========================= */

function buildSystemPrompt(intent = "general") {
  return `
You are SmartBot inside Smart Job.

Rules:
- Answer naturally.
- If user asks personal questions (name, hello), respond normally.
- Keep answers short.
- Use job data only when needed.
- Never hallucinate jobs.

Intent: ${intent}
`;
}

/* =========================
   MAIN ROUTE
========================= */

router.post("/", async (req, res) => {
  try {
    const message = cleanText(req.body?.message || "");
    if (!message) return res.json({ reply: "Please type a message." });

    const user = await getLoggedUser(req);

    /* ⭐ NEW LAYER (IMPORTANT) */
    const generalReply = smartGeneralReply(message, user);
    if (generalReply) {
      return res.json({ reply: generalReply });
    }

    let jobs = [];
    let intent = "general";

    if (isJobSearchQuestion(message)) {
      intent = "job-search";
      jobs = await getRecentOpenJobs();
    }

    if (!aiClient) {
      return res.json({ reply: localFallback(message, jobs) });
    }

    const userPrompt = `
User: ${message}

User Info:
${formatUser(user)}

Jobs:
${formatJobs(jobs)}
`;

    const completion = await aiClient.chat.completions.create({
      model: AI_MODEL,
      temperature: 0.2,
      messages: [
        { role: "system", content: buildSystemPrompt(intent) },
        { role: "user", content: userPrompt },
      ],
    });

    const reply = completion?.choices?.[0]?.message?.content;

    return res.json({
      reply: reply || localFallback(message, jobs),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      reply: "SmartBot error occurred.",
      error: err.message,
    });
  }
});

console.log("AI READY:", !!process.env.OPENROUTER_API_KEY);
console.log("openrouter model:", !!process.env.OPENROUTER_MODEL ? process.env.OPENROUTER_MODEL : "meta-llama/llama-3-8b-instruct");


module.exports = router;