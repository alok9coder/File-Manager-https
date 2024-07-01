
import { readdirSync, lstatSync } from "node:fs";


class DirectoryPath {
    constructor(uniqueDirectoryID, directoryName, folder) {
        if (directoryName[directoryName.length - 1] === "/") {
            this.directory = directoryName;
        } else {    
            this.directory = directoryName + "/";
        }

        this.uniqueID = uniqueDirectoryID;
        if (folder) {
            this.folder = folder;
        } else {
            this.folder = "";
        }
    }

    printPath() {
        console.log("uniqueDirectoryID --> ", this.uniqueID);
        console.log("directoryName --> ", this.directory);
        console.log("folder --> ", this.folder);
    }

    readDirectory() {
            try {
                const ReadDirResult = readDir(this.directory);
                console.log(ReadDirResult);

                if (this.folder) {
                    const data = {
                    pageTitle: this.folder,
                    filesAndFolders: ReadDirResult,
                    dirPath: `${this.directory}`,
                    }
                    
                    this.data = data;
                    return data;
                } else {
                    const data = {
                        pageTitle: `${this.directory}`,
                        filesAndFolders: ReadDirResult,
                        dirPath: `${this.directory}`,
                    }
                    
                    this.data = data;
                    return data;
                }

            } catch (error) {
                console.log(error);
                return error;
                //res.json(error);
            }
        //});
    }
}


export function readDir(Dir) {
    try {
        if (Dir[Dir.length - 1] === "/") {
            Dir = Dir;
        } else {    
            Dir = Dir + "/";
        }
        let FoldersAndFiles = readdirSync(Dir);
        return (seperateFilesAndFolders(Dir, FoldersAndFiles));
    } catch (error) {
        console.log(error);
        return (error);
    }
}

function seperateFilesAndFolders(Dir, FoldersAndFiles) {
    let FoldersVsFiles = {
        Folders: [],
        Files: [],
    };

    for (let i = 0; i < FoldersAndFiles.length; i++) {
        const fPath = Dir + FoldersAndFiles[i];
        if ((fPath != "D:/Recovery") &&
            (fPath != "D:/System Volume Information") &&
            (fPath != "D://Recovery") &&
            (fPath != "D://System Volume Information") &&
            (fPath != "D:\Recovery") &&
            (fPath != "D:\System Volume Information") &&
            (fPath != "D:\\Recovery") &&
            (fPath != "D:\\System Volume Information")) {       
            if (lstatSync(fPath).isDirectory() && (fPath != "D:/$AV_AVG") && (fPath != "D:/$RECYCLE.BIN")) {
                FoldersVsFiles.Folders.push(FoldersAndFiles[i]);
            } else {
                FoldersVsFiles.Files.push(FoldersAndFiles[i]);
            }
        }
    }

    return FoldersVsFiles;
}

export default DirectoryPath;
