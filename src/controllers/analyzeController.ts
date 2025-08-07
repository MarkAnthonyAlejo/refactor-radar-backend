import { Request, Response } from 'express';
import { analyzeCodeService } from '../services/analyzerService';
import { detectLanguageFromFilename } from '../utils/languageDetector';

export const analyzeCodeController = async (req: Request, res: Response) => {
  try {

    const { filename, code } = req.body;

    if (!filename || !code) {
      return res.status(400).json({ error: 'Filename and code are required' });
    }

    //Here we are Detecting the language from file extension 
    const language = detectLanguageFromFilename(filename);
    if(!language) {
      return res.status(422).json({error: `Unsuppoerted file type: ${filename}`})
    }

    //This will get the services needed for the code to be returned
    //Checks if it has code, the filename and the type of coding language
    const result = await analyzeCodeService(code, filename,language);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in analyzeCodeController:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
