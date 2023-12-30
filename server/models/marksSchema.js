// const mongoose = require("mongoose");

// const marksSchema = new mongoose.Schema({

//     _id: {
//         type: String,
//         required: true
//     },
//     fac: String,
//     name: String,
//     dateofDataInsertion: Date,
//     marks: [String]
// })

// module.exports = marksSchema


import mongoose form "mongoose";

const marksSchema = new mongoose.Schema({
    faculty_no:{
        type:String,
        required:true,
        index: true,
    },
    name:{
        type: String,
    },
    marks:{
        type:[Number], // will parse the marks into number using parseInt(string,base) to convert an string to number...
    }
},{timestamps:true});


export marksSchema = new mongoose.model("marksSchema",marksSchema);
