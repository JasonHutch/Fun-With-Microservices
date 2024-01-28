require('dotenv').config();
const express = require('express');
const fs = require('fs');

const app = express();
const port = process.env.PORT;

if(!port) {
    throw new Error('Please specift the port number with env PORT');
}

app.get('/', (req,res) => {
    res.send('Hello World!');
});

app.get('/video',(req,res) => {
    const path = './videos/sample_video.mp4';

    fs.stat(path, (err,stats) => {
        if(err) {
            console.error('An error occurred: ${err}');
            res.sendStatus(500);
            return;
        }
        res.writeHead(200, {
            'Content-Length': stats.size,
            'Content-Type': 'video/mp4',
        });

        fs.createReadStream(path).pipe(res);
    })
});

app.listen(process.env.PORT, () => {
    console.log(`Example app listening on port ${port}`);
})