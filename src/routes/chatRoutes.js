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

const AI_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-5-chat";

/* =====================================================
   CLEANING
===================================================== */

function cleanText(value = "") {
  return sanitizeString(String(value || "")).trim();
}

/* =====================================================
   INTENT DETECTION
===================================================== */

function isGreeting(message = "") {
  const m = message.toLowerCase().trim();

  return [
    "hi",
    "hello",
    "hey",
    "namaste",
    "good morning",
    "good afternoon",
    "good evening",
  ].includes(m);
}

function isAboutSmartJobQuestion(message = "") {
  const m = message.toLowerCase();

  return (
    m.includes("smart job") ||
    m.includes("smartjob") ||
    m.includes("about this website") ||
    m.includes("about your website") ||
    m.includes("what is this website") ||
    m.includes("tell me about")
  );
}

function isCapabilityQuestion(message = "") {
  const m = message.toLowerCase();

  return (
    m.includes("what can you do") ||
    m.includes("how can you help") ||
    m.includes("what do you do") ||
    m.includes("your features")
  );
}

function isShowAllJobsQuestion(message = "") {
  const m = message.toLowerCase();

  return (
    m.includes("show all jobs") ||
    m.includes("all jobs") ||
    m.includes("recent jobs") ||
    m.includes("latest jobs") ||
    m.includes("what jobs are available")
  );
}

function isJobSearchQuestion(message = "") {
  const m = message.toLowerCase();

  return (
    isShowAllJobsQuestion(message) ||
    m.includes("which job") ||
    m.includes("suitable job") ||
    m.includes("recommend job") ||
    m.includes("job match") ||
    m.includes("available job") ||
    m.includes("find job") ||
    m.includes("career") ||
    m.includes("python") ||
    m.includes("java") ||
    m.includes("javascript") ||
    m.includes("react") ||
    m.includes("node") ||
    m.includes("backend") ||
    m.includes("frontend") ||
    m.includes("developer") ||
    m.includes("engineer") ||
    m.includes("data analyst") ||
    m.includes("machine learning") ||
    m.includes("cybersecurity") ||
    m.includes("security") ||
    m.includes("devops") ||
    m.includes("qa") ||
    m.includes("ui") ||
    m.includes("ux") ||
    m.includes("experience") ||
    m.includes("fresher") ||
    m.includes("remote")
  );
}

function isHowToQuestion(message = "") {
  const m = message.toLowerCase();

  return (
    m.includes("how to") ||
    m.includes("how do i") ||
    m.includes("how can i") ||
    m.includes("steps") ||
    m.includes("apply") ||
    m.includes("application status") ||
    m.includes("post job") ||
    m.includes("manage application") ||
    m.includes("update profile") ||
    m.includes("forgot password") ||
    m.includes("reset password") ||
    m.includes("close job") ||
    m.includes("reopen job") ||
    m.includes("delete job")
  );
}

function isResumeQuestion(message = "") {
  const m = message.toLowerCase();

  return (
    m.includes("resume") ||
    m.includes("cv") ||
    m.includes("pdf") ||
    m.includes("analyze my resume") ||
    m.includes("improve my resume") ||
    m.includes("resume match")
  );
}

function isApplicationQuestion(message = "") {
  const m = message.toLowerCase();

  return (
    m.includes("application") ||
    m.includes("applied") ||
    m.includes("status") ||
    m.includes("cancel application") ||
    m.includes("my applications")
  );
}

function isProfileQuestion(message = "") {
  const m = message.toLowerCase();

  return (
    m.includes("profile") ||
    m.includes("skills") ||
    m.includes("bio") ||
    m.includes("overview") ||
    m.includes("improve my profile")
  );
}

/* =====================================================
   AUTH USER FROM JWT
===================================================== */

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

/* =====================================================
   KEYWORDS
===================================================== */

function extractKeywords(message = "", user = null) {
  const m = message.toLowerCase();
  const keywords = [];

  if (m.includes("python")) keywords.push("python", "django", "flask", "backend", "developer");
  if (m.includes("java")) keywords.push("java", "spring", "backend", "developer");
  if (m.includes("javascript") || m.includes("js")) keywords.push("javascript", "react", "node", "frontend", "backend");
  if (m.includes("react")) keywords.push("react", "frontend", "javascript");
  if (m.includes("node")) keywords.push("node", "express", "backend", "javascript");
  if (m.includes("backend")) keywords.push("backend", "api", "server", "developer");
  if (m.includes("frontend")) keywords.push("frontend", "react", "javascript", "ui");
  if (m.includes("full stack") || m.includes("fullstack")) keywords.push("full stack", "frontend", "backend", "react", "node");
  if (m.includes("data")) keywords.push("data", "analyst", "python", "sql");
  if (m.includes("machine learning") || m.includes("ai")) keywords.push("ai", "machine learning", "python");
  if (m.includes("cybersecurity") || m.includes("security")) keywords.push("cybersecurity", "security", "soc", "network security");
  if (m.includes("devops")) keywords.push("devops", "deployment", "cloud", "ci", "cd");
  if (m.includes("qa") || m.includes("tester")) keywords.push("qa", "testing", "tester", "bug");
  if (m.includes("ui") || m.includes("ux")) keywords.push("ui", "ux", "figma", "design");
  if (m.includes("remote")) keywords.push("remote");

  message
    .split(/\s+/)
    .map((word) => word.replace(/[^a-zA-Z0-9+#.]/g, ""))
    .filter((word) => word.length > 2)
    .forEach((word) => keywords.push(word));

  if (user?.skills) {
    String(user.skills)
      .split(/[, ]+/)
      .map((word) => word.trim())
      .filter((word) => word.length > 2)
      .forEach((word) => keywords.push(word));
  }

  return [...new Set(keywords)].slice(0, 18);
}

/* =====================================================
   FAKE JOB FILTER
===================================================== */

function isRealJob(job) {
  const title = String(job.title || "").trim().toLowerCase();
  const location = String(job.location || "").trim().toLowerCase();

  const fakeWords = [
    "dgdsv",
    "xv",
    "vsdv",
    "vzxv",
    "test",
    "demo",
    "asdf",
    "abc",
    "qwerty",
    "sample",
    "dummy",
  ];

  if (!title || title.length < 3) return false;
  if (fakeWords.includes(title)) return false;
  if (fakeWords.includes(location)) return false;

  return true;
}

/* =====================================================
   DATABASE READERS
===================================================== */

async function getMatchingJobs(message = "", user = null) {
  const keywords = extractKeywords(message, user);

  if (!keywords.length) return [];

  const orConditions = [];

  keywords.forEach((word) => {
    orConditions.push(
      { title: { [Op.like]: `%${word}%` } },
      { description: { [Op.like]: `%${word}%` } },
      { requirements: { [Op.like]: `%${word}%` } },
      { skills: { [Op.like]: `%${word}%` } },
      { jobType: { [Op.like]: `%${word}%` } },
      { experienceLevel: { [Op.like]: `%${word}%` } },
      { location: { [Op.like]: `%${word}%` } }
    );
  });

  const jobs = await Job.findAll({
    where: {
      status: "open",
      [Op.or]: orConditions,
    },
    attributes: [
      "title",
      "description",
      "requirements",
      "location",
      "salaryRange",
      "jobType",
      "experienceLevel",
      "skills",
      "createdAt",
    ],
    include: [
      {
        model: User,
        as: "recruiter",
        attributes: ["name"],
        include: [
          {
            model: Company,
            as: "company",
            attributes: ["name", "about"],
            required: false,
          },
        ],
      },
    ],
    limit: 8,
    order: [["createdAt", "DESC"]],
  });

  return jobs.filter(isRealJob);
}

async function getRecentOpenJobs() {
  const jobs = await Job.findAll({
    where: { status: "open" },
    attributes: [
      "title",
      "description",
      "requirements",
      "location",
      "salaryRange",
      "jobType",
      "experienceLevel",
      "skills",
      "createdAt",
    ],
    include: [
      {
        model: User,
        as: "recruiter",
        attributes: ["name"],
        include: [
          {
            model: Company,
            as: "company",
            attributes: ["name", "about"],
            required: false,
          },
        ],
      },
    ],
    limit: 8,
    order: [["createdAt", "DESC"]],
  });

  return jobs.filter(isRealJob);
}

async function getApplicationsContext(user) {
  if (!Application || !user?.id) return "No application data available.";

  try {
    if (user.role === "candidate") {
      const apps = await Application.findAll({
        where: { candidateId: user.id },
        include: [
          {
            model: Job,
            as: "job",
            attributes: ["title", "location", "jobType", "status"],
            required: false,
          },
        ],
        limit: 8,
        order: [["createdAt", "DESC"]],
      });

      if (!apps.length) return "Candidate has no applications yet.";

      return apps
        .map((app, index) => {
          return `
Application ${index + 1}
Job Title: ${app.job?.title || "Unknown job"}
Job Location: ${app.job?.location || "Not added"}
Job Type: ${app.job?.jobType || "Not added"}
Application Status: ${app.status || "pending"}
Resume Uploaded: ${app.resumeUrl ? "Yes" : "No"}
`;
        })
        .join("\n");
    }

    if (user.role === "recruiter") {
      const apps = await Application.findAll({
        include: [
          {
            model: Job,
            as: "job",
            where: { recruiterId: user.id },
            attributes: ["title", "location", "jobType", "status"],
            required: true,
          },
        ],
        limit: 8,
        order: [["createdAt", "DESC"]],
      });

      if (!apps.length) return "Recruiter has no applications yet.";

      return apps
        .map((app, index) => {
          return `
Application ${index + 1}
Job Title: ${app.job?.title || "Unknown job"}
Job Location: ${app.job?.location || "Not added"}
Job Type: ${app.job?.jobType || "Not added"}
Application Status: ${app.status || "pending"}
Resume Uploaded: ${app.resumeUrl ? "Yes" : "No"}
`;
        })
        .join("\n");
    }

    return "No application data available.";
  } catch (err) {
    console.error("Application context error:", err.message);
    return "Application data could not be read safely.";
  }
}

/* =====================================================
   RESUME PDF READER
===================================================== */

function safeUploadPath(filePath = "") {
  const clean = String(filePath || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^http:\/\/localhost:5000\//, "")
    .replace(/^http:\/\/127\.0\.0\.1:5000\//, "");

  if (!clean.startsWith("uploads/")) return null;

  return path.join(__dirname, "../../", clean);
}

async function readPdfText(filePath) {
  try {
    const absPath = safeUploadPath(filePath);

    if (!absPath || !fs.existsSync(absPath)) return "";

    const buffer = fs.readFileSync(absPath);
    const data = await pdfParse(buffer);

    return String(data.text || "").replace(/\s+/g, " ").trim().slice(0, 2200);
  } catch (err) {
    console.error("PDF read error:", err.message);
    return "";
  }
}

async function getResumeContext(user) {
  if (!Application || !user?.id) return "No resume data available.";

  try {
    let apps = [];

    if (user.role === "candidate") {
      apps = await Application.findAll({
        where: { candidateId: user.id },
        limit: 2,
        order: [["createdAt", "DESC"]],
      });
    }

    if (user.role === "recruiter") {
      apps = await Application.findAll({
        include: [
          {
            model: Job,
            as: "job",
            where: { recruiterId: user.id },
            attributes: ["title"],
            required: true,
          },
        ],
        limit: 2,
        order: [["createdAt", "DESC"]],
      });
    }

    if (!apps.length) return "No resume uploads found.";

    const output = [];

    for (const app of apps) {
      if (!app.resumeUrl) continue;

      const text = await readPdfText(app.resumeUrl);

      output.push(`
Related Job: ${app.job?.title || "Not available"}
Extracted Resume Text:
${text || "Resume could not be read or has no extractable text."}
`);
    }

    return output.length ? output.join("\n") : "No readable resume text found.";
  } catch (err) {
    console.error("Resume context error:", err.message);
    return "Resume data could not be read safely.";
  }
}

/* =====================================================
   FORMATTERS
===================================================== */

function formatUser(user) {
  if (!user) return "Guest user, not logged in.";

  return `
Name: ${user.name || "Not added"}
Role: ${user.role || "Not added"}
Skills: ${user.skills || "Not added"}
Bio: ${user.bio || "Not added"}
Overview: ${user.overview || "Not added"}
Location: ${user.location || "Not added"}
Company: ${user.company?.name || "Not added"}
Company Overview: ${user.company?.about || "Not added"}
`;
}

function formatJobs(jobs = []) {
  if (!jobs.length) return "No suitable open jobs found.";

  return jobs
    .map((job, index) => {
      return `
Job ${index + 1}
Title: ${job.title || "Untitled Job"}
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
How to view: Open Find Jobs and search this title: ${job.title || "Untitled Job"}
`;
    })
    .join("\n");
}

/* =====================================================
   LOCAL FALLBACK
===================================================== */

function localFallback(message = "", jobs = []) {
  const m = message.toLowerCase();

  if (isGreeting(message)) {
    return "Hello! How can I help you today?";
  }

  if (isCapabilityQuestion(message)) {
    return "I can help with job matching, applications, recruiter tools, profile improvement, and resume review if a resume is uploaded.";
  }

  if (m.includes("post job")) {
    return "To post a job as a recruiter: login, open Find Jobs or My Jobs, click + Post Job, fill the job details, then click Create Post.";
  }

  if (m.includes("apply")) {
    return "To apply: open Find Jobs, choose a job, click View, click Apply Now, fill your details, upload your PDF resume, and submit.";
  }

  if (m.includes("profile")) {
    return "To update your profile: click your profile photo or name, choose Edit Profile, add your skills, bio, location, website and overview, then save.";
  }

  if (isJobSearchQuestion(message)) {
    if (!jobs.length) {
      return "No suitable jobs were found in Smart Job right now.";
    }

    const list = jobs
      .slice(0, 4)
      .map((job, i) => {
        const company =
          job.recruiter?.company?.name ||
          job.recruiter?.name ||
          "Company not added";

        return `${i + 1}. ${job.title} at ${company} — ${job.location || "Location not added"}. Search this title in Find Jobs.`;
      })
      .join("\n");

    return `Matching jobs:\n${list}`;
  }

  return "I can help with Smart Job. Ask about jobs, applications, resumes, profiles, or recruiter tools.";
}

/* =====================================================
   PROMPT BUILDER
===================================================== */

function buildSystemPrompt(intent = "general") {
  return `
You are SmartBot, an advanced GPT-style assistant inside the Smart Job portal.

Core behavior:
- Think silently before answering. Never show your reasoning.
- Read the user's exact words carefully.
- Answer only what the user asked.
- Give the most useful final answer, not a long explanation.
- Do not add random suggestions.
- Do not talk about jobs unless the user asks about jobs, skills, career, applications, resume, recruiter tools, or Smart Job features.
- If the user asks a simple question, answer simply.
- If the user asks "how", give short numbered steps.
- If the user asks for recommendation, compare the user's words with provided database data.
- If database data is missing, say it is not available.
- If no matching job exists, say no suitable job was found in Smart Job right now.
- Never invent jobs, companies, applications, or resume details.

Answer style:
- Short and clear.
- Use headings only when helpful.
- Use bullets only when they make the answer easier.
- Avoid long paragraphs.
- Avoid repeated sentences.
- Avoid unnecessary warnings.
- Avoid excessive markdown symbols.
- Do not use **bold markdown** too much.
- Keep most answers under 120 words unless the user asks for detail.

Smart Job knowledge:
- Candidates can find jobs, view jobs, apply with PDF resume, track applications, cancel applications, and update profiles.
- Recruiters can post jobs, edit jobs, close jobs, reopen jobs, delete their own jobs, view applications, and update statuses.
- Profiles can include photo, name, bio, overview, skills, location, website, and company information.
- Job posts include title, description, requirements, location, salary, job type, experience level, and skills.

Job matching rules:
- Use only the relevant jobs provided in the prompt.
- Match by skills, experience, title, requirements, location, and job type.
- If recommending a job, mention only:
  - title
  - company
  - location
  - short reason
  - "Open Find Jobs and search this title."
- Do not show raw job IDs.
- Do not show internal links.

Resume rules:
- Only discuss resume content when resume text is provided.
- If resume text is missing, say the resume could not be read.
- Give practical improvements only.

Safety rules:
- Never reveal passwords.
- Never reveal JWT tokens.
- Never reveal reset tokens.
- Never reveal database credentials.
- Never reveal private phone numbers or private emails.
- Never reveal resume paths or upload paths.
- Never reveal backend API routes.
- Never reveal raw database IDs.
- Never show links like view-job.html?id=2.

Current user intent: ${intent}
`;
}

/* =====================================================
   MAIN CHAT ROUTE
===================================================== */

router.post("/", async (req, res) => {
  try {
    const message = cleanText(req.body?.message || "");

    if (!message) {
      return res.json({ reply: "Please type a question first." });
    }

    const user = await getLoggedUser(req);

    let jobs = [];
    let applicationContext = "";
    let resumeContext = "";
    let intent = "general";

    if (isGreeting(message)) {
      intent = "greeting";
    } else if (isCapabilityQuestion(message)) {
      intent = "capability";
    } else if (isHowToQuestion(message)) {
      intent = "how-to";
    } else if (isJobSearchQuestion(message)) {
      intent = "job-search";
    } else if (isProfileQuestion(message)) {
      intent = "profile";
    } else if (isResumeQuestion(message)) {
      intent = "resume";
    } else if (isApplicationQuestion(message)) {
      intent = "application";
    } else if (isAboutSmartJobQuestion(message)) {
      intent = "about-smartjob";
    }

    if (isJobSearchQuestion(message)) {
      jobs = isShowAllJobsQuestion(message)
        ? await getRecentOpenJobs()
        : await getMatchingJobs(message, user);
    }

    if (isApplicationQuestion(message)) {
      applicationContext = await getApplicationsContext(user);
    }

    if (isResumeQuestion(message)) {
      resumeContext = await getResumeContext(user);
    }

    if (!aiClient) {
      return res.json({
        reply: localFallback(message, jobs),
      });
    }

    const userPrompt = `
User question:
${message}

User profile:
${formatUser(user)}

Relevant jobs:
${isJobSearchQuestion(message) ? formatJobs(jobs) : "Not needed for this question."}

Application context:
${applicationContext || "Not needed for this question."}

Resume context:
${resumeContext || "Not needed for this question."}
`;

    const completion = await aiClient.chat.completions.create({
      model: AI_MODEL,
      temperature: 0.2,
      top_p: 0.8,
      max_tokens: 450,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(intent),
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

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

console.log("OPENROUTER KEY EXISTS:", !!process.env.OPENROUTER_API_KEY);
console.log("OPENROUTER MODEL:", AI_MODEL);

module.exports = router;