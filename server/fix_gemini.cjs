const fs = require('fs');
let lines = fs.readFileSync('utils/geminiClient.js', 'utf8').split('\n');
lines.splice(64,1);
lines.splice(21,1);
lines.splice(0,12,
  "import { GoogleGenerativeAI } from '@google/generative-ai';",
  "",
  "/**",
  " * Invokes Gemini AI to get matched project recommendations based on the resume text and current project list.",
  " * @param {string} resumeText ",
  " * @param {Array<Object>} projects "
);
fs.writeFileSync('utils/geminiClient.js', lines.join('\n'));
