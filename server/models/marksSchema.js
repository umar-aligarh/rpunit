const mongoose = require("mongoose");

const marksSchema = new mongoose.Schema({

    _id: {
        type: String,
        required: true
    },
    fac: String,
    name: String,
    dateofDataInsertion: Date,
    marks: [String]
})

module.exports = marksSchema