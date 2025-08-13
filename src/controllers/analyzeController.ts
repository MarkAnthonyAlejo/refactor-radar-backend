import { Request, Response } from 'express';
import { analyzeCodeService } from '../services/analyzerService';
import { detectLanguageFromFilename } from '../utils/languageDetector';

export const analyzeCodeController = async (req: Request, res: Response) => {
  console.log('hello -> ', req.body)
  try {

    for (let i = 0; i < req.body.length; i++) {
    const filename = req.body[i].filename;
    const code = req.body[i].code;

    console.log(`File ${i + 1}: ${filename}`);
    // console.log("Code:", code);


     if (!filename || !code) {
      return res.status(400).json({ error: 'Filename and code are required' });
    }

    //Here we are Detecting the language from file extension 
    const language = detectLanguageFromFilename(filename);

    console.log('Hello2 -> ', language)
    
    if (!language) {
      return res.status(422).json({ error: `Unsuppoerted file type: ${filename}` })
    }

    // Run your analysis function here
    analyzeCodeService(filename, code, language);
  }

  res.json({ message: "Files processed" });


    //This will get the services needed for the code to be returned
    //Checks if it has code, the filename and the type of coding language

    // res.status(200).json(result);
  } catch (error) {
    console.error('Error in analyzeCodeController:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
