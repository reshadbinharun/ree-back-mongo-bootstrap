const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const PORT = 8080;

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
    // TODO: enforce before deploying
    // origin: ['http://localhost:3000','https://onefootin-beta.herokuapp.com/'],
    origin: CORS_ALLOW_REGEX,
  }
app.use(cors(corsOptions));

/*
add routes here
*/
app.get('/test', (req, res) => {
    console.log("ping from client...");
    res.status(200).send({
        message: 'What\'s up?'
    })
})

app.listen(app.get('port'), () => {
    console.log('Express server listening on port ' + app.get('port'))
});


