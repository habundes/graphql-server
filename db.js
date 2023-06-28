import mongoose from "mongoose"

const { MONGO_DB_URI } = process.env

mongoose.connect(MONGO_DB_URI)
  .then(() => {
    console.log('🚀 connected successfully to mongo db');
  })
  .catch((e) => {
    console.error(e)
    console.log(MONGO_DB_URI);
  })