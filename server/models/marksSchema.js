const mongoose = require("mongoose");

const marksSchema = new mongoose.Schema({

    _id: {
        type: String,
        required: true
    },
    name: String,
    marks: [String]
},{versionKey: false
})

module.exports = marksSchema