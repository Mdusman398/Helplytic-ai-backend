import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const CATEGORIES = ["academics", "technical", "career", "health", "lifestyle", "creative", "other"];

// KEYWORD FALLBACKS (In case API fails)
const CATEGORY_KEYWORDS = {
  academics: ["school", "college", "university", "exam", "study", "homework", "project", "assignment", "course"],
  technical: ["code", "programming", "bug", "error", "software", "app", "development", "javascript", "python", "react"],
  career: ["job", "interview", "resume", "career", "hiring", "promotion", "salary", "work", "professional"],
  health: ["health", "fitness", "diet", "exercise", "medical", "doctor", "mental", "wellness", "nutrition"],
  lifestyle: ["travel", "hobby", "food", "cooking", "fashion", "relationship", "family", "dating"],
  creative: ["art", "design", "music", "writing", "photography", "video", "creative", "content", "editing"],
};

// AUTO-CATEGORIZE
export const aiCategorize = async (title, description) => {
  try {
    const prompt = `Classify this community help request into exactly one of these categories: ${CATEGORIES.join(", ")}. 
    Return ONLY the category name in lowercase.
    
    Title: ${title}
    Description: ${description}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim().toLowerCase();

    return CATEGORIES.includes(text) ? text : "other";
  } catch (error) {
    console.error("Gemini Categorization Error:", error);
    // Fallback to keyword logic
    const text = `${title} ${description}`.toLowerCase();
    const scores = {};
    Object.entries(CATEGORY_KEYWORDS).forEach(([category, keywords]) => {
      scores[category] = keywords.filter(keyword => text.includes(keyword)).length;
    });
    const maxScore = Math.max(...Object.values(scores));
    return maxScore > 0 ? Object.keys(scores).find(cat => scores[cat] === maxScore) : "other";
  }
};

// SUGGEST TAGS
export const aiSuggestTags = async (title, description) => {
  try {
    const prompt = `Based on this help request, suggest up to 5 short, relevant tags (e.g., React, Resume, Fitness). 
    Return the tags as a comma-separated list. Return ONLY the tags.
    
    Title: ${title}
    Description: ${description}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    const raw = text
      .split(/,|\n/)
      .map((tag) => tag.trim())
      .filter(Boolean);

    // Deduplicate + clamp
    const seen = new Set();
    return raw
      .filter((t) => {
        const key = t.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 5);
  } catch (error) {
    console.error("Gemini Tag Suggestion Error:", error);
    return ["Community", "Support"]; // Simple fallback
  }
};

// GENERATE SUMMARY
export const generateSummary = async (description) => {
  try {
    const prompt = `Provide a very concise (maximum 150 characters) summary of this help request. 
    Focus on what the user needs help with specifically.
    
    Description: ${description}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Gemini Summary Error:", error);
    return description.length > 150 ? description.substring(0, 147) + "..." : description;
  }
};

// DETECT URGENCY
export const detectUrgency = async (title, description) => {
    try {
      const prompt = `Analyze the urgency of this help request and classify it as exactly one of: low, medium, high, critical.
      Return ONLY the level.
      
      Title: ${title}
      Description: ${description}`;
  
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim().toLowerCase();
  
      const levels = ["low", "medium", "high", "critical"];
      return levels.includes(text) ? text : "medium";
    } catch (error) {
      console.error("Gemini Urgency Detection Error:", error);
      return "medium";
    }
  };

// Re-calculate relevance can stay local as it is a math logic based on data
export const calculateRelevanceScore = (helper, request) => {
  let score = 0;
  if (request.requiredSkills && request.requiredSkills.length > 0) {
    const matchedSkills = request.requiredSkills.filter(skill =>
      helper.skills.some(helperSkill =>
        helperSkill.toLowerCase().includes(skill.toLowerCase())
      )
    ).length;
    score += (matchedSkills / request.requiredSkills.length) * 40;
  }
  if (request.helperLocation && helper.location) {
    if (helper.location.toLowerCase().includes(request.helperLocation.toLowerCase())) {
      score += 20;
    }
  }
  score += Math.min((helper.trustScore / 100) * 30, 30);
  if (request.category && helper.interests) {
    if (helper.interests.some(interest =>
      interest.toLowerCase().includes(request.category.toLowerCase())
    )) {
      score += 10;
    }
  }
  return Math.round(score);
};
