import { MongoClient, ObjectId } from "mongodb";

// Once we connect to the database once, we'll store that connection
// and reuse it so that we don't have to connect to the database on every request.
let cachedDb = null;
const dbName = 'Images'
const imageCollection = 'ImageData'

const connectToDatabase = async () => {
  if (cachedDb) {
    return cachedDb;
  }

  const client = await MongoClient.connect(process.env.MONGODB_URI);

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

  const body = JSON.parse(event.body || {});
  let response = "";

  try {
    response = await db.collection(imageCollection).insertOne(body);
  } catch (e) {
    console.error(e)
    return {
      statusCode: 500,
      body: JSON.stringify(e),
      headers: {
        "Content-Type": "application/json",
      },
    };
  }

  return {
    statusCode: 201,
    body: JSON.stringify(response, null, 2),
    headers: {
      "Content-Type": "application/json",
    },
  };
}

export const updateData = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const db = await connectToDatabase();
  const body = JSON.parse(event.body || {});
  const id = event?.pathParameters?.id;

  try {
    const filter = { _id: id }
    const updateDoc = {
      $set: {
        imageName: body.imageName || {},
        imageText: body.imageText || {},
        imageKey: body.imageKey || {},
        imageUrl: body.imageUrl || {},
        urlExpiresIn: body.urlExpiresIn || {}
      }
    }

    const res = await db.collection(imageCollection).updateOne(filter, updateDoc);

    return {
      statusCode: 200,
      body: JSON.stringify(res, null, 2),
      headers: {
        "Content-Type": "application/json",
      },
    };
  } catch (e) {
    console.error(e)
    return {
      statusCode: 500,
      body: JSON.stringify(e),
      headers: {
        "Content-Type": "application/json",
      },
    };
  }
}

export const bulkUpdate = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const db = await connectToDatabase();
  const body = JSON.parse(event.body || {});

  const bulkOperations = [];
  for (const d of body) {
    const updateDoc = {
      $set: {
        imageName: d.imageName,
        imageText: d.imageText,
        imageKey: d.imageKey,
        imageUrl: d.imageUrl,
        urlExpiresIn: d.urlExpiresIn
      }
    }
    bulkOperations.push({ updateOne: { filter: { _id: ObjectId.createFromHexString(d._id) }, update: updateDoc } });
  }

  try {
    const res = await db.collection(imageCollection).bulkWrite(bulkOperations);
    return {
      statusCode: 200,
      body: JSON.stringify(res, null, 2),
      headers: {
        "Content-Type": "application/json",
      },
    };
  } catch (e) {
    console.error(e)
    return {
      statusCode: 500,
      body: JSON.stringify(e),
      headers: {
        "Content-Type": "application/json",
      },
    };
  }
}
