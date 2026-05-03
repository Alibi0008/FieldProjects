const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listAll() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    console.log('--- ALL MODELS ---');
    data.models.forEach(m => {
      console.log(`${m.name} (${m.displayName})`);
    });
    console.log('--- END ---');
  } catch (error) {
    console.error('Error:', error);
  }
}

listAll();
