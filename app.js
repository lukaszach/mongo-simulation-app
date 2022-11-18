const {MongoClient} = require("mongodb");

const appName = 'mongodb-simulation-app'
const appLog = `${appName}:`


const mongoUrl = process.env.MONGO_URL;
const mongoUser = process.env.MONGO_USER;
const mongoPass = process.env.MONGO_PASS;
const mongoDb = process.env.MONGO_DB;
const mongoCollection = process.env.MONGO_COLLECTION;

let counter = 0;

// Connection URI
const uri = `mongodb+srv://${mongoUser}:${mongoPass}@${mongoUrl}/?retryWrites=true&w=majority`;
// Create a new MongoClient
const client = new MongoClient(uri);

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function simulation() {
    try {
        // Connect the client to the server (optional starting in v4.7)
        console.log(appLog, "Connecting ...");
        await client.connect();
        // Establish and verify connection
        await client.db("admin").command({ping: 1});
        console.log(appLog, "Connected successfully to server");

        const collection = client.db(mongoDb).collection(mongoCollection);
        while (true) {
            const currentCounter = counter;
            const doc = {name: "document access simulation", time: new Date(), counter: counter++, operation: 'write'};
            const result = await collection.insertOne(doc);
            console.log(appLog, `A document (${currentCounter}) written with _id: ${result.insertedId}`);

            await collection.updateOne({_id: result.insertedId}, {
                $set: {
                    operation: 'write&read',
                },
            });
            console.log(appLog, `Updated document with _id: ${result.insertedId}`);

            const findResult = await collection.findOne({_id: result.insertedId});
            console.log(appLog, `Found document by previous ID: ${JSON.stringify(findResult)}`);

            await sleep(100);
        }
    } catch (err) {
        console.error(appLog, err);
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}

async function run() {
    while (true) {
        await simulation();
        console.error(appLog, "App failed, waiting 1s to reconnect ...");
        await sleep(1000);
    }
}

console.log(appLog, "Init app done");

run().catch(console.log);
