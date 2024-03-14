import { MongoClient } from "mongodb";

// Once we connect to the database once, we'll store that connection
// and reuse it so that we don't have to connect to the database on every request.
let cachedDb = null;
const dbName = 'Images'
const imageCollection = 'Imagedata'

const connectToDatabase = async () => {
  if (cachedDb) {
    return cachedDb;
  }

  const client = await MongoClient.connect(process.env.MONGODB_URI, {
    pkFactory: { createPk: () => crypto.randomUUID() },
  });

  // Specify which database we want to use
  cachedDb = client.db(dbName);

  return cachedDb;
}

export const getData = async (_evt, context) => {
  // By default, the callback waits until the runtime event loop is empty
  // before freezing the process and returning the results to the caller.
  // Setting this property to false requests that AWS Lambda freeze the
  // process soon after the callback is invoked, even if there are events
  // in the event loop.
  context.callbackWaitsForEmptyEventLoop = false;

  // Get an instance of our database
  const db = await connectToDatabase();

  // Make a MongoDB MQL Query
  const data = await db.collection(imageCollection).find({}).toArray();

  return {
    statusCode: 200,
    body: JSON.stringify(data, null, 2),
    headers: {
      "Content-Type": "application/json",
    },
  };
}

export const addData = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const db = await connectToDatabase();

  const body = JSON.parse(event.body);
  const response = await db.collection(imageCollection).insertOne(body);

  return {
    statusCode: 200,
    body: JSON.stringify(response, null, 2),
    headers: {
      "Content-Type": "application/json",
    },
  };
}
