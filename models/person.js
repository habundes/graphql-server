import { Schema, model } from "mongoose"
import uniqueValidator from 'mongoose-unique-validator'

const schema = new Schema({
    name: {
        type: String,
        require: true,
        unique: true,
        minLength: 5,
    },
    phone: {
        type: String,
        minLength: 5,
    },
    street: {
        type: String,
        require: true,
        minLength: 5,
    },
    city: {
        type: String,
        require: true,
        minLength: 3,
    },
})

schema.plugin(uniqueValidator)

export default model('Person', schema)