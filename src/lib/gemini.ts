import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("VITE_GEMINI_API_KEY is not set in the environment variables. Please add it to your .env file.");
}

const genAI = new GoogleGenerativeAI("AIzaSyBOvsKo6n4Ps620Hb5dSgheuY83B43kQGI");

export const generativeModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});
