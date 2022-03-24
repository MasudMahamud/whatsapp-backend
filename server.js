//importing
import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import Pusher from 'pusher';
import cors from 'cors';


//app config
const app = express();
const port = process.env.PORT || 5000;


const pusher = new Pusher({
  appId: "1365789",
  key: "3db6d64916e1733ba852",
  secret: "337459f42d0f434a4d61",
  cluster: "eu",
  useTLS: true
});

const db = mongoose.connection;

db.once('open', () => {
     console.log('db connect')

    const msgCollection = db.collection('messagecontents');
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change) => {
        
        if(change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted', {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received,
            });
        } else {
            console.log('error triggering pusher')
        }
    })
})


//middleware
app.use(express.json());
app.use(cors());


//DB config
const connection_url = `mongodb+srv://whatapp:KePeMZcoaj9RRHif@cluster0.n50q4.mongodb.net/whatsapp?retryWrites=true&w=majority`
mongoose.connect(connection_url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // useFindAndModify: false
})

//api routes
app.get('/', (req, res) => res.status(200).send("hello world it's work"));

app.get('/messages/sync', (req, res) => {
    Messages.find((err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(200).send(data)
        }
    })
})

app.post('/messages/new', (req, res) => {
    const dbMessage = req.body;

    Messages.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(201).send(data)
        }
    });
});


//listen
app.listen(port, () =>console.log(`listening on port:${port}`));