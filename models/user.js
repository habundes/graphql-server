import { Schema, model } from 'mongoose'
import uniqueValidator from 'mongoose-unique-validator'

const user = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        minLength: 3,
    },
    friends: [{
        ref: 'Person',
        type: Schema.Types.ObjectId
    }]
})
user.plugin(uniqueValidator)

export default model('User', user)