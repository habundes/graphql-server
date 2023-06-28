import mongoose from "mongoose"

const URI = `mongodb+srv://habundes:admsr000@cluster0.1zahxid.mongodb.net/midudev?retryWrites=true&w=majority`

mongoose.connect(URI)
    .then(() => {
        console.log('🚀 connected successfully to mongo db');
    })
    .catch((e) => {
        console.error(e)
    })