require('dotenv').config();

const bodyParser = require('body-parser')
const express = require('express');

const amqp = require('amqplib');
const mongodb = require('mongodb');

const RABBIT = process.env.RABBIT;
const DB_HOST = process.env.DB_HOST;
const DB_NAME = process.env.DB_NAME;
const PORT = process.env.PORT;

function connectRabbit() {
    return amqp.connect(RABBIT)
        .then(connection => {
            return connection.createChannel();
        })
}

function connectdb() {
    return mongodb.MongoClient.connect(DB_HOST)
        .then((client) => {
            return client.db(DB_NAME);
        });
};

function setupHandlers(db, messageChannel) {
    const videoCollection = db.collection('videos');

    function consumeViewedMessage(msg) {
        const parsedMsg = JSON.parse(msg.content.toString());
        return videoCollection.insertOne({ videoPath: parsedMsg.videoPath })
            .then(() => {
                messageChannel.ack(msg);
            });
    };

    // return messageChannel.assertQueue("viewed", {})
    //     .then(() => {
    //         return messageChannel.consume("viewed", consumeViewedMessage);
    //     });

    return messageChannel.assertExchange("viewed","fanout",{})
        .then(() => {
            return messageChannel.assertQueue("", {exclusive: true})
        })
        .then(response => {
            const queueName = response.queue;

            return messageChannel.bindQueue(queueName, "viewed", "")
                .then(() => {
                    return messageChannel.consume(queueName, consumeViewedMessage);
                })
        })
}

function startHttpServer(db, messageChannel) {
   return new Promise(resolve => {
    const app = express();
    app.use(bodyParser.json());
    setupHandlers(db, messageChannel);

    app.listen(PORT, () => {
        console.log(`Microservice online`);
        resolve();
    })
   })
}

function main() {
    return connectdb()
        .then(db => {
            return connectRabbit()
                .then(messageChannel => {
                    return startHttpServer(db, messageChannel);
                })
        })

}
main()
    .then(() => console.log("Microservice Online"))
    .catch(err => {
        console.error("Microservice failed to start", err);
        process.exit(1);
    });