const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    // There isn't a direct listModels method on the client instance in some versions, 
    // but let's try to just use a known working model or see if the error persists.

    // Actually, newer SDKs might make it hard to list models without using the model manager if exposed.
    // Let's rely on documentation/common knowledge if this fails, but I'll try to use the model first to see if it works in isolation.

    console.log("Testing gemini-1.5-flash...");
    const result = await model.generateContent("Hello");
    console.log("gemini-1.5-flash works!");
    console.log(result.response.text());
  } catch (error) {
    console.error("gemini-1.5-flash failed:", error.message);

    console.log("\nTesting gemini-pro-vision...");
    try {
      const modelVision = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
      // gemini-pro-vision requires image usually, trying simple text might fail on input, but let's see if it 404s.
      // It accepts text only? No, usually needs image. 
      // But let's try gemini-1.5-pro

      console.log("Testing gemini-1.5-pro...");
      const modelPro = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const resultPro = await modelPro.generateContent("Hello");
      console.log("gemini-1.5-pro works!");
    } catch (err2) {
      console.error("gemini-1.5-pro failed:", err2.message);
    }
  }
}

listModels();
