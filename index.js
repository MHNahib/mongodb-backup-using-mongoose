const mongoose = require("mongoose");
const { promisify } = require("util");
const fs = require("fs");
const archiver = require("archiver");

const connectDb = async () => {
  await mongoose.connect(
    "mongodb://alchemyDev:alchemyDev12345@18.116.14.182:37017/nur-projectdb?authSource=admin",
    { useNewUrlParser: true }
  );
  console.log("MongoDB connected...");
};

const getAllCollections = async () => {
  const collections = await mongoose.connection.db.listCollections().toArray();
  return collections.map((collection) => collection.name);
};

const getAllDataFromCollection = async (collectionName) => {
  const collection = mongoose.connection.collection(collectionName);
  const cursor = collection.find({});
  const toArrayAsync = promisify(cursor.toArray).bind(cursor);
  const data = await toArrayAsync();
  console.log("working on: ", collectionName, " ☠️");
  return { collectionName, data };
};

const zipData = async (data) => {
  const output = fs.createWriteStream("data.zip");
  const archive = archiver("zip", {
    zlib: { level: 9 },
  });

  archive.pipe(output);

  data.forEach(({ collectionName, data }) => {
    archive.append(JSON.stringify(data), { name: `${collectionName}.json` });
  });

  await archive.finalize();
  console.log("Data zipped successfully!");
};

(async () => {
  try {
    await connectDb();
    const collectionNames = await getAllCollections();
    console.log("-----------------------------------------");
    console.log(
      `| TOTAL COLLECTIONS |       ${collectionNames.length}           |`
    );
    console.log("-----------------------------------------");
    const dataPromises = collectionNames.map((item, index) => {
      console.log(`${index + 1} --- ${item}`);
      return getAllDataFromCollection(item);
    });
    const data = await Promise.all(dataPromises);
    await zipData(data);
    mongoose.disconnect();
  } catch (error) {
    console.error(error);
    mongoose.disconnect();
  }
})();
