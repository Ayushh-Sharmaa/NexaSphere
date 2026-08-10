import { parseResumePDF } from '../utils/resumeParser.js';
import { getRecommendationsFromGemini } from '../utils/geminiClient.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

// Fallback / mock projects if database is empty or not configured.
// Keep these synchronized with website/src/data/projectsData.js
const FALLBACK_PROJECTS = [
  {
    id: 'nexa-portal',
    title: 'NexaSphere Portal',
    shortDesc:
      'The official community portal for NexaSphere members to manage events and activities.',
    shortDesc: 'The official community portal for NexaSphere members to manage events and activities.',
    category: 'Web App',
    techStack: ['React', 'Node.js', 'Express', 'MongoDB', 'Vite'],
  },
  {
    id: 'ai-attend',
    title: 'AI Attendance Tracker',
    shortDesc: 'Facial recognition-based attendance system for college lectures and workshops.',
    category: 'Machine Learning',
    techStack: ['Python', 'OpenCV', 'TensorFlow', 'Flask', 'PostgreSQL'],
  },
  {
    id: 'secure-share',
    title: 'SecureShare',
    shortDesc: 'End-to-end encrypted file sharing mobile application.',
    category: 'Cybersecurity',
    techStack: ['React Native', 'Firebase', 'WebCrypto API'],
  },
  {
    id: 'ui-kit',
    title: 'Nexa UI Kit',
    shortDesc: 'A comprehensive design system for all NexaSphere applications.',
    category: 'UI/UX Design',
    techStack: ['Figma', 'Storybook', 'React', 'CSS Modules'],
  },
  {
    id: 'campus-connect',
    title: 'Campus Connect App',
    shortDesc: 'Mobile application to connect students with campus clubs and events.',
    category: 'Mobile',
    techStack: ['Flutter', 'Dart', 'Firebase'],
  },
  {
    id: 'cyber-dashboard',
    title: 'Threat Intel Dashboard',
    shortDesc: 'Real-time dashboard for monitoring cybersecurity threats and vulnerabilities.',
    category: 'Cybersecurity',
    techStack: ['Vue.js', 'D3.js', 'Python', 'Elasticsearch'],
  },
];

/**
 * Handle POST request for project recommendations based on resume upload.
 */
export async function getProjectRecommendations(req, res, next) {
  try {
    if (!req.file) {
      return sendError(req, res, 'Please upload a PDF resume file.', 400, 'VALIDATION_ERROR');
      return res.status(400).json({ error: 'Please upload a PDF resume file.' });
    }

    // Extract text from the uploaded PDF resume
    const resumeText = await parseResumePDF(req.file.buffer || req.file.path);

    // If Gemini key is not configured, we'll return a mock recommendation
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY is not set. Returning mock recommendations.');
      // Return mock recommendations mapping to our project list
      return sendSuccess(res, [
        {
          projectId: 'nexa-portal',
          matchChips: ['React', 'Node.js', 'Vite'],
          whyItMatches:
            'Your resume shows strong React and frontend experience which aligns perfectly with NexaSphere Portal requirements.',
    }

    // Call Gemini API with parsed resume text and projects list
  }
    const recommendations = await getRecommendationsFromGemini(resumeText, FALLBACK_PROJECTS);
    return sendSuccess(res, recommendations);
  } catch (error) {
    console.error('Error in getProjectRecommendations controller:', error);
    return sendError(
      req,
      res,
      error.message || 'An error occurred during resume analysis.',
      500,
      'INTERNAL_ERROR'
    );
  }
}
