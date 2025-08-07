//Here we will determine what language the file will be
//for now we will only use JS 

import path from 'path'

const extensionToLanguage: Record<string, string> = {
    js: 'javascript'
    //will add more languages later
};

export function detectLanguageFromFilename(filename: string): string | null {
    const extension = path.extname(filename).toLowerCase().replace('.', '');
    return extensionToLanguage[extension] || null;
}