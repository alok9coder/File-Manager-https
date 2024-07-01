
import { readDir } from "./Directory.js";

export async function searchFiles(name, dir) {
    
    let dirReadResult = readDir(dir);

    let result = {
        Folders: [],
        Files: [],
    };
    
    let pattern = [];

    for (let i = 0; i < name.length; i++) {
        if (name.charCodeAt(i) !== 32) {
            pattern += name[i].toLowerCase();
        }
    }
    console.log("pattern: ", pattern);
    console.log("directory: ", dir);
    const patternLength = pattern.length;
    //console.log("patternLength: ", patternLength);

    // Folder Search Algorithm.
    for (let i = 0; i < dirReadResult.Folders.length; i++) {
        let folderName = [];

        for (let j = 0; j < dirReadResult.Folders[i].length; j++) {
            if (dirReadResult.Folders[i].charCodeAt(j) !== 32) {
                folderName += dirReadResult.Folders[i][j].toLowerCase();
            }
        }

        //console.log("movieName: ", movieName);

        for (let k = 0; k <= (folderName.length - patternLength); k++) {
            let strcomp = [];

            for (let l = 0; l < patternLength; l++) {
                strcomp += folderName[k + l]
            }

            if (pattern === strcomp) {
                if (result.Folders.length <= 0) {
                    result.Folders.push(dir + dirReadResult.Folders[i]);  console.log("A | folderName: ", folderName);
                } else if (result.Folders.findIndex((string) => string === dirReadResult.Folders[i]) < 0) {
                    result.Folders.push(dir + dirReadResult.Folders[i]);  console.log("B | folderName: ", folderName);
                } else {
                    strcomp = [];
                }
            }
        }
    }

    // File Search Algorithm.
    for (let i = 0; i < dirReadResult.Files.length; i++) {
        let fileName = [];

        for (let j = 0; j < dirReadResult.Files[i].length; j++) {
            if (dirReadResult.Files[i].charCodeAt(j) !== 32) {
                fileName += dirReadResult.Files[i][j].toLowerCase();
            }
        }

        //console.log("movieName: ", movieName);

        for (let k = 0; k <= (fileName.length - patternLength - 4); k++) {
            let strcomp = [];

            for (let l = 0; l < patternLength; l++) {
                strcomp += fileName[k + l]
            }

            if (pattern === strcomp) {
                if (result.Files.length <= 0) {
                    result.Files.push(dir + dirReadResult.Files[i]);  console.log("A | fileName: ", fileName);
                } else if (result.Files.findIndex((string) => string === dirReadResult.Files[i]) < 0) {
                    result.Files.push(dir + dirReadResult.Files[i]);  console.log("B | fileName: ", fileName);
                } else {
                    strcomp = [];
                }
            }
        }
    }
    
    return result;
}

