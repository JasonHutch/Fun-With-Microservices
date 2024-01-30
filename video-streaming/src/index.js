require('dotenv').config();
const http = require('http');
const express = require('express');
const mongodb = require('mongodb');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT;
const VIDEO_STORAGE_HOST = process.env.VIDEO_STORAGE_HOST;
const VIDEO_STORAGE_PORT = parseInt(process.env.VIDEO_STORAGE_PORT);
const DB_HOST = process.env.DB_HOST;
const DB_NAME = process.env.DB_NAME;

if(!PORT) {
    throw new Error('Please specift the port number with env PORT');
}

app.get('/', (req,res) => {
    res.send('Hello World Live Reload!');
});

function main() {
    return mongodb.MongoClient.connect(DB_HOST)
        .then(client => {
            const db = client.db(DB_NAME);
            const videosCollection = db.collection('videos');
            

            app.get('/video',(req,res) => {
                const videoId = new mongodb.ObjectId(req.query.id);
                console.log(req.query.id);
                console.log(videoId);
                videosCollection.findOne({_id: videoId})
                    .then(videoRecord => {
                        if(videoRecord == null) {
                            console.error(`No video found with id ${videoId}`);
                            res.sendStatus(404);
                            return;
                        }

                        const forwardRequest = http.request({
                            host:VIDEO_STORAGE_HOST,
                            port: VIDEO_STORAGE_PORT,
                            path: `/video?path=${videoRecord.videoPath}`,
                            method: 'GET',
                            headers: req.headers,
                        },
                        forwardResponse => {
                            res.writeHeader(forwardResponse.statusCode, forwardResponse.headers);
                            forwardResponse.pipe(res);
                        });
                        req.pipe(forwardRequest);
                    })
                    .catch(err => {
                        console.error(`Error while reading from database: ${err}`);
                        res.sendStatus(500);
                    });
            });

            app.listen(PORT, () => {
                console.log(`Example app listening on port ${PORT}`);
            });
        });
}

main()
   .then(()=>console.log("Microservice Online"))
   .catch(err => console.error(err));