import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Invokes Gemini AI to get matched project recommendations based on the resume text and current project list.
 * @param {string} resumeText 
 * @param {Array<Object>} projects 
 * @returns {Promise<Object>}
 */
export async function getRecommendationsFromGemini(resumeText, projects) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }

  const ai = new GoogleGenerativeAI(apiKey);
  const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
You are an expert career advisor and technical project recommender.
Given the candidate's resume text below and the list of available community projects, select the top 3 best matching projects for this candidate.

For each selected project, you MUST provide:
1. The project id.
2. A list of 2-4 short "match chips" (e.g. "React", "Frontend", "UI Design", "Database Design").
3. A brief 1-2 sentence explanation of "why it matches" their profile and skills.

Respond ONLY with a valid JSON array of objects. Do not include markdown code block formatting or backticks around the JSON.
Each object must have the following structure:
{
  "projectId": "string",
  "matchChips": ["string", "string"],
  "whyItMatches": "string"
}

Resume Text:
---
${resumeText}
---

Available Projects:
${JSON.stringify(projects, null, 2)}
`;

  try {
    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.response.text();
    // Parse the JSON response
    const cleanedText = text
      .replace(/```json/gi, '')
      .replace(/```/gi, '')
      .trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Failed to get recommendations from Gemini:', error);
    throw new Error('Error processing recommendations with AI: ' + error.message);
  }
}
