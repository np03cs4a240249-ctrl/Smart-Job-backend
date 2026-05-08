const express = require("express");
const router = express.Router();

const { sanitizeString } = require("../utils/security");
const { Job, User, Company } = require("../models");
const jwt = require("jsonwebtoken");
const OpenAI = require("openai");

/* -------------------- GROQ AI SETUP -------------------- */

let aiClient = null;

if (process.env.GROQ_API_KEY) {
  aiClient = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });
}

const GROQ_MODEL =
  process.env.GROQ_MODEL || "llama-3.1-8b-instant";

/* -------------------- AUTH USER FROM TOKEN -------------------- */

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

/* -------------------- READ LOGGED USER PROFILE -------------------- */

async function getLoggedUser(req) {
  const userId = getUserIdFromToken(req);

  if (!userId) return null;

  return User.findByPk(userId, {
    attributes: [
      "id",
      "name",
      "role",
      "bio",
      "overview",
      "skills",
      "location",
      "website",
      "companyType",
    ],

    include: [
      {
        model: Company,
        as: "company",
        attributes: ["id", "name", "website", "about"],
        required: false,
      },
    ],
  });
}

/* -------------------- READ OPEN JOBS FROM DATABASE -------------------- */

async function getAllOpenJobs() {
  return Job.findAll({
    where: {
      status: "open",
    },

    attributes: [
      "id",
      "title",
      "description",
      "requirements",
      "location",
      "salaryRange",
      "jobType",
      "experienceLevel",
      "skills",
      "contactEmail",
      "contactPhone",
      "createdAt",
    ],

    include: [
      {
        model: User,
        as: "recruiter",
        attributes: ["id", "name"],

        include: [
          {
            model: Company,
            as: "company",
            attributes: ["name", "website", "about"],
            required: false,
          },
        ],
      },
    ],

    limit: 30,
    order: [["createdAt", "DESC"]],
  });
}

/* -------------------- FORMAT USER FOR AI -------------------- */

function formatUser(user) {
  if (!user) {
    return "Guest user, not logged in.";
  }

  return `
Name: ${user.name}
Role: ${user.role}
Skills: ${user.skills || "Not added"}
Bio: ${user.bio || "Not added"}
Overview: ${user.overview || "Not added"}
Location: ${user.location || "Not added"}
Website: ${user.website || "Not added"}
Company: ${user.company?.name || "Not added"}
Company Overview: ${user.company?.about || "Not added"}
`;
}

/* -------------------- FORMAT JOBS FOR AI -------------------- */

function formatJobs(jobs = []) {
  if (!jobs.length) {
    return "No open jobs are currently available.";
  }

  return jobs
    .map((job) => {
      return `
Job ID: ${job.id}
Title: ${job.title}
Company: ${
        job.recruiter?.company?.name ||
        job.recruiter?.name ||
        "Company not added"
      }
Location: ${job.location || "Not added"}
Salary: ${job.salaryRange || "Not added"}
Type: ${job.jobType || "Not added"}
Experience: ${job.experienceLevel || "Not added"}
Skills: ${job.skills || "Not added"}
Description: ${job.description || "Not added"}
Requirements: ${job.requirements || "Not added"}
Contact Email: ${job.contactEmail || "Not added"}
Contact Phone: ${job.contactPhone || "Not added"}
Link: view-job.html?id=${job.id}
`;
    })
    .join("\n");
}

/* -------------------- LOCAL FALLBACK IF AI FAILS -------------------- */

function localFallback(message = "", jobs = []) {
  const m = message.toLowerCase();

  if (m.includes("hello") || m.includes("hi") || m.includes("namaste")) {
    return "Hello! 👋 I am SmartBot. I can help you find suitable jobs, improve your profile, apply for jobs, or guide recruiters.";
  }

  if (jobs.length) {
    const list = jobs
      .slice(0, 5)
      .map((job, i) => {
        const company =
          job.recruiter?.company?.name ||
          job.recruiter?.name ||
          "Company not added";

        return `${i + 1}. ${job.title} at ${company} — ${
          job.location || "Location not added"
        }. Open: view-job.html?id=${job.id}`;
      })
      .join("\n");

    return `AI is not active right now, but I found these open jobs:\n\n${list}`;
  }

  return "AI is not active right now. Please check GROQ_API_KEY in your backend .env file.";
}

/* -------------------- CHAT ROUTE -------------------- */

router.post("/", async (req, res) => {
  try {
    const message = sanitizeString(req.body?.message || "");

    if (!message) {
      return res.json({
        reply: "Please type a question first.",
      });
    }

    const [jobs, user] = await Promise.all([
      getAllOpenJobs(),
      getLoggedUser(req),
    ]);

    if (!aiClient) {
      return res.json({
        reply: localFallback(message, jobs),
      });
    }

    let completion;

    try {
      completion = await aiClient.chat.completions.create({
        model: GROQ_MODEL,
        temperature: 0.7,
        max_tokens: 700,

        messages: [
          {
            role: "system",
            content: `
You are SmartBot, a real AI assistant inside Smart Job portal.

You can:
- greet naturally
- answer normal user questions
- recommend suitable jobs using the provided database jobs
- explain why jobs match the user's skills, location and experience
- guide candidates about applications, resumes, profiles and job search
- guide recruiters about posting jobs, applications and company profiles

Important safety rules:
- Never reveal passwords.
- Never reveal JWT tokens.
- Never reveal reset tokens.
- Never reveal database credentials.
- Never expose hidden private user data.
- Use only the data provided in this prompt.
- Do not invent jobs that are not listed.
- If recommending jobs, include title, company, location and link.
- Job links must be exactly: view-job.html?id=JOB_ID
- If no matching job exists, say that and suggest profile/skill improvements.
- Keep answers friendly and practical.
`,
          },
          {
            role: "user",
            content: `
User question:
${message}

Current user profile:
${formatUser(user)}

Open jobs from database:
${formatJobs(jobs)}
`,
          },
        ],
      });
    } catch (aiError) {
      console.error("GROQ AI ERROR:", aiError);

      return res.json({
        reply: localFallback(message, jobs),
      });
    }

    const aiReply = completion?.choices?.[0]?.message?.content;

    return res.json({
      reply: aiReply || localFallback(message, jobs),
    });
  } catch (err) {
    console.error("SmartBot route error:", err);

    return res.status(500).json({
      message: "SmartBot failed",
      error: err.message,
    });
  }
});

console.log("GROQ KEY EXISTS:", !!process.env.GROQ_API_KEY);
console.log("GROQ MODEL:", GROQ_MODEL);

module.exports = router;