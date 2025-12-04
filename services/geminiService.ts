import { GoogleGenAI } from "@google/genai";
import { ApplicantProfile, TargetCompany, DiscoveredCompany } from "../types";

// Helper to reliably parse JSON from AI response
const safeJSONParse = <T>(text: string, fallback: T): T => {
  try {
    let cleanText = text.replace(/```json/g, '').replace(/```/g, '');
    const firstBrace = cleanText.indexOf('{');
    const firstBracket = cleanText.indexOf('[');
    
    let startIndex = -1;
    if (firstBrace !== -1 && firstBracket !== -1) startIndex = Math.min(firstBrace, firstBracket);
    else if (firstBrace !== -1) startIndex = firstBrace;
    else startIndex = firstBracket;

    const lastBrace = cleanText.lastIndexOf('}');
    const lastBracket = cleanText.lastIndexOf(']');
    let endIndex = Math.max(lastBrace, lastBracket);

    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      cleanText = cleanText.substring(startIndex, endIndex + 1);
      return JSON.parse(cleanText) as T;
    }
    return JSON.parse(cleanText) as T;
  } catch (e) {
    console.warn("JSON Parse Warning. Raw:", text);
    return fallback;
  }
};

// Initialize AI with Vite environment variable
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export const analyzeCV = async (fileBase64: string, mimeType: string): Promise<Partial<ApplicantProfile>> => {
  try {
    const prompt = `
    Analyze the attached CV/Resume document and extract the applicant's profile data.
    Return the result strictly as a JSON object matching this structure:
    {
      "fullName": "Name Surname",
      "university": "University Name",
      "department": "Department Name",
      "grade": "Current Grade",
      "specialty": "Main profession title",
      "keySkill": "A short hook sentence (Max 15 words).",
      "startDate": "Estimated availability",
      "phone": "Phone number if found",
      "email": "Email address if found",
      "linkedin": "LinkedIn profile URL if found"
    }
    Extract phone, email and LinkedIn even if they are just text (not links).
    Ensure extracted text is in TURKISH.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: fileBase64 } },
          { text: prompt }
        ]
      },
      config: { responseMimeType: "application/json" }
    });

    return safeJSONParse<Partial<ApplicantProfile>>(response.text || "{}", {});
  } catch (error: any) {
    console.error("CV Analysis Error:", error);
    throw new Error("CV analizi yapılamadı: " + error.message);
  }
};

export const findTechnoparkCompanies = async (city: string, technopark: string | undefined, excludeList: string[]): Promise<DiscoveredCompany[]> => {
  try {
    const excludeString = excludeList.length > 0 ? `Do NOT include: ${excludeList.join(', ')}.` : '';
    const prompt = `
    Find 10 NEW active technology companies located in ${city} ${technopark ? `specifically in ${technopark}` : ''}.
    Focus on companies hiring interns.
    ${excludeString}
    Output TURKISH JSON array:
    [ { "name": "Name", "location": "Location", "brief": "Description" } ]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.6,
      }
    });

    const result = safeJSONParse<DiscoveredCompany[]>(response.text || "[]", []);
    if (!Array.isArray(result)) throw new Error("Invalid format");
    return result;
  } catch (error: any) {
    console.error("Discovery Error:", error);
    throw new Error(error.message || "Şirket bulunamadı.");
  }
};

export const analyzeCompany = async (companyName: string): Promise<{ industry: string; focusTopic: string; contactPerson: string; email: string; sources: string[] }> => {
  try {
    const prompt = `
    Research company "${companyName}" for internship in Turkey.
    Find: Industry, Strategic Focus (for email personalization), HR Contact Name, HR Email.
    JSON Output: { "industry": "...", "focusTopic": "...", "contactPerson": "...", "email": "..." }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] }
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web?.uri).filter((uri: string) => uri) || [];

    const defaultData = {
      industry: "Teknoloji",
      focusTopic: `${companyName} projeleri`,
      contactPerson: "İnsan Kaynakları",
      email: ""
    };

    const data = safeJSONParse(response.text || "{}", defaultData);
    return { ...defaultData, ...data, sources };

  } catch (error) {
    console.error("Analysis Error:", error);
    throw new Error("Şirket analizi yapılamadı.");
  }
};

export const generateEmail = async (profile: ApplicantProfile, company: TargetCompany): Promise<{ subject: string; body: string }> => {
  try {
    // Build contact info footer
    let contactInfo = '';
    if (profile.phone) contactInfo += `Telefon: ${profile.phone}\n`;
    if (profile.email) contactInfo += `E-posta: ${profile.email}\n`;
    if (profile.linkedin) contactInfo += `LinkedIn: ${profile.linkedin}\n`;
    if (profile.portfolio) contactInfo += `Portfolio: ${profile.portfolio}\n`;
    
    const prompt = `
    Write a professional internship email (Turkish).
    FROM: ${profile.fullName} (${profile.university}, ${profile.department})
    TO: ${company.name} (${company.analysis?.contactPerson})
    FOCUS: ${company.analysis?.focusTopic}
    MY SKILL: ${profile.keySkill}
    TONE: ${profile.tone}
    DATES: ${profile.startDate}
    
    Structure:
    1. Introduction (Mention 'İşletmede Mesleki Eğitim' between ${profile.startDate}, insurance covered by school).
    2. Connection (Link my skill to their focus topic).
    3. Call to Action.
    4. End with:
    
    Saygılarımla,
    ${profile.fullName}
    ${contactInfo}
    
    IMPORTANT: Include the contact info (phone, email, LinkedIn) at the end, NOT placeholders like "[Telefon Numaranız]". Use the actual values provided.
    ${profile.cvUrl ? 'Also mention CV is attached to email.' : ''}
    
    JSON Output: { "subject": "...", "body": "..." }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    return safeJSONParse(response.text || "{}", { subject: "Başvuru", body: "Hata oluştu." });
  } catch (error) {
    console.error("Email Gen Error:", error);
    throw new Error("E-posta oluşturulamadı.");
  }
};