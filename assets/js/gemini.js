
// Configuration
const API_KEY = "AIzaSyCwFPZVsLimH2hhO_Ar3u7V0EQtSgAsAFs"; 
const MODEL_NAME = "gemini-2.5-flash";

/**
 * Helper to lazily load the Gemini SDK only when needed.
 * This prevents the entire website from breaking if esm.sh or the SDK is blocked.
 */
async function getAI() {
    if (!API_KEY || API_KEY.includes("YOUR_GEMINI")) {
        throw new Error("API Key not configured");
    }
    // Dynamic import
    const { GoogleGenAI } = await import("https://esm.sh/@google/genai");
    return new GoogleGenAI({ apiKey: API_KEY });
}

export const getDailyChallenge = async () => {
    try {
        const ai = await getAI();
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: "Generate a simple, quick (under 5 mins), non-clinical mental wellbeing challenge for a teenager. Examples: 'Take a photo of something yellow', 'Write down 3 wins'. Return valid JSON with 'title' and 'description'.",
            config: {
                responseMimeType: "application/json"
            }
        });
        
        const text = response.text;
        if (!text) throw new Error("Empty response");
        return JSON.parse(text);
    } catch (e) {
        console.warn("AI Unavailable (Challenge):", e);
        // Fallback content so the UI always works
        return { title: "Nature Spotting", description: "Look out the window and find 3 things that are green." };
    }
}

export const getMoodAffirmation = async (mood) => {
    try {
        const ai = await getAI();
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `The user is feeling "${mood}". Give a short, 1-sentence validating and supportive affirmation for a teenager. No advice, just validation.`,
        });
        return response.text || "It's okay to feel how you feel.";
    } catch (e) {
        console.warn("AI Unavailable (Affirmation):", e);
        return "You are doing your best, and that is enough.";
    }
}
