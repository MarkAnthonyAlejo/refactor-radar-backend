// controller/analyzeCodeController.ts
import { Request, Response } from 'express';
import fs from 'fs';
import { analyzeCodeService } from '../services/analyzerService';
import { detectLanguageFromFilename } from '../utils/languageDetector';

export const analyzeCodeController = async (req: Request, res: Response) => {
  try {
    for (let i = 0; i < req.body.length; i++) {
      const filePath = req.body[i].filename;

      if (!filePath) {
        return res.status(400).json({ error: 'Filename is required' });
      }

      // Read the actual file contents
      const code = fs.readFileSync(filePath, 'utf-8');

      console.log(`File ${i + 1}: ${filePath}`);
      console.log('Code preview:', code.substring(0, 100), '...'); // optional preview

      if (!code) {
        return res.status(400).json({ error: 'Code could not be read from file' });
      }

      // Detect language based on file extension
      const language = detectLanguageFromFilename(filePath);
      console.log('Detected language:', language);

      if (!language) {
        return res.status(422).json({ error: `Unsupported file type: ${filePath}` });
      }

      // Run the analysis service
      const result = await analyzeCodeService(filePath, code, language);

      // Optional: log detected long functions from service
      console.log('Analysis result:', result.suggestions);
    }

    res.json({ message: 'Files processed successfully' });
  } catch (error) {
    console.error('Error in analyzeCodeController:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
