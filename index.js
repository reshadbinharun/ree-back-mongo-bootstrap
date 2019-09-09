const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

/*
Entity Schematics
Drug:
    ...
    identifier: 
    Mechanisms: [],
    DevelopmentStatuses: []
Mechanism:
    ...
    indentifier:
    DrugIds: []
DomainSearchable:
    ...
    indentifier:
    relativeId:
    domain:
*/

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }

const DRUG = 'Drug';
const MOLECULAR_MECHANISM = 'Mechanism';
const SEARCH_COLLECTION = 'Search'

const mongo = require('mongodb').MongoClient
ObjectId = require('mongodb').ObjectID;

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
        const drugsCollection = db.collection(DRUG);
        const mechCollection = db.collection(MOLECULAR_MECHANISM);
        const searchCollection = db.collection(SEARCH_COLLECTION);
        app.get('/test', (req, res) => {
            console.log("ping from client...");
            res.status(200).send({
                message: 'What\'s up?'
            })
        })

        /*
        Seeding Database with test data
        */

       app.post('/uploadDrugs', async (req, res) => {
            let drugObjs = req.body;
            // make record for each drug, make mechanism id columns

            /*
                Inserting Drugs
            */

            await asyncForEach(drugObjs, async (drug) => {
                //create all mechanisms and get ids --> upsert
                let drugAdded = await drugsCollection.insertOne(drug);
                let drugIdJustAdded = drugAdded.insertedId;
                // make addition in searchCollection
                await searchCollection.insertOne({
                    name: drug.mainName,
                    relationalId: drugIdJustAdded,
                    domain: DRUG
                })

                /*
                    Inserting/Updating Mechanisms
                */
                await asyncForEach(drug.molecularMechanism, async (mech) => {
                    let foundMech = await mechCollection.findOne(
                        {name: mech.name}
                    )
                    // adding new mechanism
                    if (!foundMech) {
                        let mechAdded = await mechCollection.insertOne({
                            name: mech.name,
                            drugs: []
                        });
                        mechIdJustAdded = mechAdded.insertedId;
                        // add to Search collection
                        await searchCollection.insertOne({
                            name: mech.name,
                            relationalId: mechIdJustAdded,
                            domain: MOLECULAR_MECHANISM
                        })
                    }
                    // Whether mechanism exists or not, add new Drug
                    await mechCollection.updateOne(
                        {name: mech.name},
                        { $push: { 'drugs': drug.mainName}},
                        {upsert: false}
                    )
                })
            })
            res.status(200).send({message: 'Got the drugs! When\'s the party'})
       })

       /*
       Search without pagination
       */
      app.post('/searchNoPage', async (req, res) => {
        let searchTerms = req.body.searchTerms;
        let searchRegex = new RegExp(`.*${searchTerms}.*`)
        let results = await searchCollection.find(
            {name: {$regex: searchRegex}}
            )
        let resultsToSend = await results.toArray();
        res.status(200).send({resultsToSend})
      });

      /*
      Get Drug information
      */
     app.post('/getDrugInfo', async (req, res) => {
        let id = req.body.id;
        let _id = ObjectId(id)
        let drugInfo = await drugsCollection.findOne({_id: _id});
        res.status(200).send({drugInfo})
     })

     /*
      Get Mechanism information
      */
     app.post('/getMechanismInfo', async (req, res) => {
        let id = req.body.id;
        let _id = ObjectId(id)
        let mechanismInfo = await mechCollection.findOne({_id: _id});
        res.status(200).send({mechanismInfo})
     })

     /*
     Get Drug by dedicated URL
     */
     app.get('/drug/:id', async (req, res) => {
        let drugInfo = []; 
        try {
            let id = ObjectId(req.params.id);
            let drugInfo = await drugsCollection.findOne({_id: id});
         } catch(e) {
            console.log("Incorrect ID format was provided...");
         }
         res.status(200).send({drugInfo});
     })

    /*
     Get Mechanism by dedicated URL
     */
    app.get('/mechanism/:id', async (req, res) => {
        let mechanismInfo = [];
        try {
            let id = ObjectId(req.params.id);
            mechanismInfo = await mechCollection.findOne({_id: id});
        } catch (e) {
            console.log("Incorrect ID format was provided...");
        }
        res.status(200).send({mechanismInfo})
    })

    app.post('/searchWithPage', async (req, res) => {
        let searchTerms = req.body.searchTerms;
        let pageNum = parseInt(req.body.pageNum);
        let resultsPerPage = parseInt(req.body.resultsPerPage);
        let searchRegex = new RegExp(`.*${searchTerms}.*`)
        // find number of results
        let resNum = await searchCollection.find({name: {$regex: searchRegex}}).count();
        let numPages = Math.ceil(resNum/resultsPerPage);
        let skip = resultsPerPage * pageNum - 1;
        console.log("skip is", skip);
        if (skip > resNum) {
        }
        let results = await searchCollection.find(
            {name: {$regex: searchRegex}}
            ).skip(skip).limit(resultsPerPage);
        let resultsToSend = await results.toArray();
        let responseObj = {
            numPages: numPages,
            resNum: resNum,
            results: resultsToSend
        }
        res.status(200).send({responseObj})
    })
})

app.listen(app.get('port'), () => {
    console.log('Express server listening on port ' + app.get('port'))
});


