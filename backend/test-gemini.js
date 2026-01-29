/**
 * Test script for Gemini API - Handwritten Notes Digitization
 */

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

async function testGeminiAPI() {
  console.log('\n🧪 Testing Gemini API for Notes Digitization\n');
  
  // Check if API key is set
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY is not set in .env file');
    return;
  }
  console.log('✅ GEMINI_API_KEY is set:', apiKey.substring(0, 10) + '...');

  try {
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    console.log('✅ Gemini client initialized');

    // Test with a simple text prompt first
    console.log('\n📝 Testing simple text generation...');
    const textResult = await model.generateContent('Say "Hello, Gemini is working!" in one short sentence.');
    const textResponse = await textResult.response;
    console.log('✅ Text response:', textResponse.text());

    console.log('\n🎉 Gemini API is working correctly!');
    console.log('\nIf the analyze/digitize features fail, the issue might be with:');
    console.log('1. Image format or size');
    console.log('2. The image content being blocked by safety filters');
    console.log('3. Network/timeout issues with large images');

  } catch (error) {
    console.error('\n❌ Gemini API Error:', error.message);
    console.error('\nFull error:', error);
    
    if (error.message.includes('API key')) {
      console.log('\n💡 Tip: Your API key might be invalid. Get a new one from https://makersuite.google.com/app/apikey');
    }
    if (error.message.includes('quota')) {
      console.log('\n💡 Tip: You may have exceeded your API quota. Check your usage at https://console.cloud.google.com/');
    }
  }
}

testGeminiAPI();
