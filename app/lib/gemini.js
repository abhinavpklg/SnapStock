import fs from 'fs';
import path from 'path'

import {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
  } from "@google/generative-ai"

  import { GoogleAIFileManager } from "@google/generative-ai/server";
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  const fileManager = new GoogleAIFileManager(apiKey);
  
  /**
   * Uploads the given file to Gemini.
   *
   * See https://ai.google.dev/gemini-api/docs/prompting_with_media
   * 
   * 
   */

  /**
 * Converts base64 string to a File object.
 * @param {string} base64Data - The base64 string of the image.
 * @param {string} mimeType - The MIME type of the image (e.g., "image/jpeg").
 * @param {string} displayName - The name to give the file.
 * @returns {File} - The created File object.
 */
  function base64ToBuffer(base64Data) {
    // Remove the base64 prefix if present
    const base64String = base64Data.replace(/^data:image\/\w+;base64,/, "");

    // Convert base64 to binary using Buffer
    const buffer = Buffer.from(base64String, 'base64');

    return buffer;
}

async function uploadToGemini(mimeType, path) {
    const uploadResult = await fileManager.uploadFile(path, {
      mimeType,
      displayName: path,
    });
    const file = uploadResult.file;
    return file;
  }
  
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  });
  
  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
  };
  
  export async function run(imageSrc) {
    const buffer = base64ToBuffer(imageSrc);
    const tempFilePath = path.join(__dirname, 'temp_image.jpg');

    fs.writeFileSync(tempFilePath, buffer);

    const filesUploaded = await uploadToGemini("image/jpeg", tempFilePath)
  
    const result = await model.generateContent([
        {
            fileData: {
                mimeType: filesUploaded.mimeType,
                fileUri: filesUploaded.uri
            }
        },
        { text: "Describe in one word what is in this image, no period at the end" },
    ]);
    fs.unlinkSync(tempFilePath);
    return result.response.text()
  }






