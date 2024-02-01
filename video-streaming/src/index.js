require('dotenv').config();
const http = require('http');
const bodyParser = require('body-parser')
const express = require('express');
const amqp = require('amqplib');
const mongodb = require('mongodb');
const { log } = require('console');

const app = express();
const PORT = process.env.PORT;
const VIDEO_STORAGE_HOST = process.env.VIDEO_STORAGE_HOST;
const VIDEO_STORAGE_PORT = parseInt(process.env.VIDEO_STORAGE_PORT);
const DB_HOST = process.env.DB_HOST;
const DB_NAME = process.env.DB_NAME;
const RABBIT = process.env.RABBIT;

if (!PORT) {
    throw new Error('Please specift the port number with env PORT');
}

app.get('/', (req, res) => {
    res.send('Hello World Live Reload!');
});

function connectRabbit() {
    return amqp.connect(RABBIT)
        .then(connection => {
            console.log("Connected to RabbitMQ");
            return connection.createChannel()
            .then(channel => {
                return channel.assertExchange("viewed", "fanout")
                    .then(() => {
                        return channel;
                    })
            })
        });
}

function connectdb() {
    return mongodb.MongoClient.connect(DB_HOST)
        .then((client) => {
            return client.db(DB_NAME);
        });
};

function sendViewedMessage(messageChannel, videoPath) {
    const msg = { videoPath: videoPath };
    const jsonMsg = JSON.stringify(msg);

    messageChannel.publish("viewed", "", Buffer.from(jsonMsg));
}

function setupHandlers(app, db, messageChannel) {
    app.get('/', (req,res) => {
        res.send('Hello World');
    })
    app.get('/video', (req, res) => {
        const videoId = new mongodb.ObjectId(req.query.id);
        const videoCollection = db.collection('videos');

        videoCollection.findOne({ _id: videoId })
            .then(videoRecord => {
                if (videoRecord == null) {
                    console.error(`No video found with id ${videoId}`);
                    res.sendStatus(404);
                    return;
                }

                const forwardRequest = http.request({
                    host: VIDEO_STORAGE_HOST,
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
                sendViewedMessage(messageChannel, videoRecord.videoPath);
            })
            .catch(err => {
                console.error(`Error while reading from database: ${err}`);
                res.sendStatus(500);
            });
    });

}

function startHttpServer(db,messageChannel) {
   return new Promise(resolve => {
    const app = express();
    app.use(bodyParser.json());
    setupHandlers(app, db, messageChannel);

    app.listen(PORT, () => {
        console.log(`Microservice online on http://localhost:${PORT}`);
        resolve();
    })
   })
}

function main() {
    return connectdb()
        .then(db => {
            return connectRabbit()
                .then(connection => {
                    return startHttpServer(db, connection)
                })
        })
}

main()
    .then(() => console.log("Microservice Online"))
    .catch(err => console.error(err));


//    {
//     "_id" : ObjectId("5d9e690ad76fe06a3d7ae416"),
//     "videoPath" : "SampleVideo_1280x720_1mb.mp4"
// }