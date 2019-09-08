const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const DRUG_COLLECTION = 'Drugs';
const MOLECULAR_MECHANISMS_COLLECTION = 'Mechanisms';

const mongo = require('mongodb').MongoClient

const PORT = 8080;

const dbConnString = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@ds219308.mlab.com:19308/${process.env.DB_NAME}`;

const app = express();
app.use(bodyParser.json());
app.set('port', process.env.PORT || PORT);
app.use(bodyParser.urlencoded({ extended: false }));

// cors setup
const CORS_ALLOW_REGEX = /.*localhost.*/;
const CORS_ALLOW_ORIGIN = 'localhost'

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', CORS_ALLOW_ORIGIN)
    next();
})

let corsOptions = {
    origin: CORS_ALLOW_REGEX,
  }
app.use(cors(corsOptions));

mongo.connect(dbConnString, {
    useNewUrlParser: true,
    useUnifiedTopology: true
    }, (err, client) => {
        if (err) {
            console.error(err)
            return;
        }
        const db = client.db(process.env.DB_NAME);
        app.get('/test', (req, res) => {
            console.log("ping from client...");
            res.status(200).send({
                message: 'What\'s up?'
            })
        })
        /*
        add routes here
        */

})

app.listen(app.get('port'), () => {
    console.log('Express server listening on port ' + app.get('port'))
});


