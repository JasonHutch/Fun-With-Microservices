require('dotenv').config();

const express = require('express');
const azure = require('azure-storage');

const PORT = process.env.PORT;
const STORAGE_ACCOUNT_NAME = process.env.STORAGE_ACCOUNT_NAME;
const STORAGE_ACCESS_KEY = process.env.STORAGE_ACCESS_KEY;

const app = express();

function createBlobService() {
    const blobService = azure.createBlobService(STORAGE_ACCOUNT_NAME, STORAGE_ACCESS_KEY);
    return blobService;
}

app.get('/', (req,res) => {
    res.send('Hello World!');
});

app.get('/video',(req,res) => {
    const videoPath = req.query.path;
    const blobService = createBlobService();
    const containerName = "videos";

    console.log(`Video path: ${videoPath}`);
    blobService.getBlobProperties(containerName, videoPath, (err, properties, status) => {
        if(err) {
            console.error(`Couldn't fetch blob properties ${err}`);
            res.sendStatus(500);
            return;
        }
        res.writeHead(200, {
            'Content-Length': properties.contentLength,
            'Content-Type': 'video/mp4',
        });
        blobService.createReadStream(containerName, videoPath,res,err => {
            if(err) {
                console.error(`Couldn't create read stream: ${err}`);
                res.sendStatus(500);
                return;
            }
        }).pipe(res);
    });
});

app.listen(PORT, () => {
    console.log(`Microsfot Online on port ${PORT}`);
})