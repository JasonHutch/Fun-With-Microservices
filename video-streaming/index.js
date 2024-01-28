require('dotenv').config();
const http = require('http');
const express = require('express');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT;
const VIDEO_STORAGE_HOST = process.env.VIDEO_STORAGE_HOST;
const VIDEO_STORAGE_PORT = parseInt(process.env.VIDEO_STORAGE_PORT);

if(!PORT) {
    throw new Error('Please specift the port number with env PORT');
}

app.get('/', (req,res) => {
    res.send('Hello World!');
});

app.get('/video',(req,res) => {
    const forwardRequest = http.request({
        host:VIDEO_STORAGE_HOST,
        port: VIDEO_STORAGE_PORT,
        path: '/video?path=SampleVideo_1280x720_1mb.mp4',
        method: 'GET',
        headers: req.headers,
    },
    forwardResponse => {
        res.writeHeader(forwardResponse.statusCode, forwardResponse.headers);
        forwardResponse.pipe(res);
    });
    req.pipe(forwardRequest);
});

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`);
})