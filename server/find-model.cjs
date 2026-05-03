const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function findFlash() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    const flashModels = data.models.filter(m => m.name.toLowerCase().includes('flash'));
    console.log('Flash Models found:', flashModels.map(m => m.name));
    
    const chatModels = data.models.filter(m => m.supportedGenerationMethods.includes('generateContent'));
    console.log('All Chat Models:', chatModels.map(m => m.name));
  } catch (error) {
    console.error('Error:', error);
  }
}

findFlash();
