import fs from "node:fs";
import express from "express";

export const downloadRoute = express.Router();

class DownloadStream {
    constructor(uniqueDownloadID, fileFormat, filePath, fileName) {
        this.downloadID = uniqueDownloadID;
        this.fileFormat = fileFormat;
        this.filePath = filePath;
        this.fileName = fileName;
    }

    printStream() {
        console.log("Download ID --> ", this.downloadID);
        console.log("File Format --> ", this.fileFormat);
        console.log("File Path --> ", this.filePath);
        console.log("File Name --> ", this.fileName);
    }

    createStream() {
        downloadRoute.get(`/download/${this.downloadID}`, (req, res) => {
            try {
                const downloadStream = fs.createReadStream(this.filePath + this.fileName);
                res.setHeader("Content-Disposition", `attachment;filename=${this.fileName}`);
                res.setHeader("Content-Type", `video/${this.fileFormat}`);
                downloadStream.on("data", (chunk) => res.write(chunk));
                downloadStream.on("end", () => res.end());
                downloadStream.on("close", () => console.log(`Download Completed for file: ${this.filePath + this.fileName}`));
            } catch (error) {
                console.log(error);
            }
        });
    }
}

export default DownloadStream;
