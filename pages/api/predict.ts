import { promises as fsPromises } from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import { exec, spawn } from 'child_process';
// import { spawn } from 'child_process';

import { promisify } from 'util';


// Disable the default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

// Define our own types for formidable
interface FormidableFile {
  filepath: string;
  originalFilename: string;
  mimetype: string;
  size: number;
}

interface FormidableFields {
  [key: string]: string | string[];
}

interface FormidableFiles {
  [key: string]: FormidableFile | FormidableFile[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("Received request to /api/predict");

  const uploadDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(uploadDir)) {
    await fsPromises.mkdir(uploadDir, { recursive: true });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = formidable({ multiples: true, keepExtensions: true });

  return new Promise<void>((resolve, reject) => {
    form.parse(req, async (err: Error | null, fields: FormidableFields, files: FormidableFiles) => {
      if (err) {
        console.error('Form parsing error:', err);
        res.status(500).json({ error: 'Error parsing form data' });
        return reject(err);
      }

      // console.log('Received files:', files);

      const pngFile = Array.isArray(files.png) ? files.png[0] : files.png;
      const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;
      if (!pngFile || !audioFile) {
        res.status(400).json({ error: 'Missing required files' });
        return resolve();
      }
      try {
        const scriptPath = path.join(process.cwd(), 'pages', 'Ai_Model', 'audioModel.py');
        console.log("Starting Python process");

        const pythonProcess = spawn('python', ['-u', scriptPath, audioFile.filepath, pngFile.filepath]);

        let pythonOutput = '';
        let pythonError = '';

        pythonProcess.stdout.on('data', (data) => {
          const output = data.toString();
          console.log('Python output:', output);
          pythonOutput += output;
        });

        pythonProcess.stderr.on('data', (data) => {
          const error = data.toString();
          console.error('Python error:', error);
          pythonError += error;
        });

        pythonProcess.on('close', (code) => {
          console.log("Python process closed with code:", code);
          if (code !== 0) {
            console.error('Python script error:', pythonError);
            res.status(500).json({ error: 'Error running AI model', details: pythonError });
            reject(new Error(pythonError));
          } else {
            console.log('Python script completed successfully');
            console.log("Raw Python output:", pythonOutput);
            let prediction;
            try {
              // Try to find JSON in the output
              const jsonMatch = pythonOutput.match(/\{.*\}/);
              if (jsonMatch) {
                const jsonString = jsonMatch[0];
                console.log("Extracted JSON string backend:", jsonString);
                prediction = JSON.parse(jsonString);
                console.log("Parsed prediction backend:", prediction);

              } else {
                throw new Error("No JSON found in Python output");
              }
            } catch (error) {
              console.error("Error parsing Python output:", error);
              return;
            }

            res.status(200).json({
              message: "Files processed successfully",
              prediction: prediction
            });

            resolve();
          }
        });

      } catch (error) {
        console.error('Processing error:', error);
        res.status(500).json({ error: 'Error during file processing' });
        reject(error);
      }
    });
  });
}
