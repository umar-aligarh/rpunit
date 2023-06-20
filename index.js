const express = require("express");
const jsdom = require('jsdom')
const bodyParser = require('body-parser');
const { async } = require("jshint/src/prod-params");
const fs = require('fs').promises;
const marksSchema = require('./server/models/marksSchema')
const mongoose = require('mongoose');
const { type } = require("os");

const app = express();
mongoose.connect('mongodb+srv://ukumarkhan1999:dAYC3lwx8oS0j69q@cluster0.b2ghbvr.mongodb.net/?retryWrites=true&w=majority')
.then(
    ()=>{
        console.log('database connected');
    },
    (err)=>{
        console.log('database connection error:',err)
    }
);
mongoose.pluralize(null);

app.set('view engine', 'ejs');
app.set('views',__dirname + '/views');

app.use(express.static(__dirname + '/public'));
app.use(express.json())
app.use(bodyParser.urlencoded({limit: '5000mb', extended: true, parameterLimit: 100000000000}));

let port = "7000"
async function saveResultInTest(en ,fac)
{
    const url = "https://ctengg.amu.ac.in/web/table_result010.php";
    const response = await fetch(url, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'Referer': 'https://ctengg.amu.ac.in/web/st_result001.php?prog=btech'
    },
    body: `fac=${fac}&en=${en}&prog=btech`
    })
    // console.log(response);
    const text = await response.text();
    await fs.writeFile(__dirname+"/public/test", text, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("The file was saved!");
    }); 
    // console.log(text);
}
async function savetoDatabase(htmlString)
{
    let dom = new jsdom.JSDOM(htmlString);
    let tbody = dom.window.document.querySelector(".table-responsive").children[0].children[0];
    let infoRow = dom.window.document.querySelector(".table-responsive").children[1].children[0].children[1];
    if(infoRow.children[0]===undefined)return;
    let en = infoRow.children[0].textContent;
    let studentName = infoRow.children[2].textContent;
    console.log(studentName);
    let numberofRows = tbody.children.length;
    // console.log(en,studentName);
    for(let i=1;i<numberofRows;i++)
    {
        let row = tbody.children[i];
        let courseName = row.children[0].textContent;
        console.log(courseName);
        let sessionalMarks = row.children[1].textContent;
        let examMarks = row.children[2].textContent;
        let graceMarks = row.children[4].textContent;
        const filter = { _id: en };
        const update = { "$set": {
            name: studentName,
            marks:[sessionalMarks,examMarks,graceMarks]
        }};
        studentModel = mongoose.model(courseName,marksSchema);
        await studentModel.findOneAndUpdate(filter, update,{upsert: true});
    }
}
app.get("/coursemarks",async(req,res)=>{
    res.write('<!DOCTYPE html><html><head><script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script><link rel="stylesheet" href="table.css"></head><body>');
    res.write('<div class="container"><div class="table"><div class="table-header">');
    res.write('<div class="header__item"><a id="name" class="filter__link" href="#">Name</a></div>');
    res.write('<div class="header__item"><a id="sessional" class="filter__link" href="#">Sessional Marks</a></div>');
    res.write('<div class="header__item"><a id="end" class="filter__link" href="#">Exam Marks</a></div>');
    res.write('<div class="header__item"><a id="total" class="filter__link" href="#">Total Marks</a></div></div><div class="table-content">');

    courseName = req.query.course;
    courseName = courseName.toUpperCase();
    console.log(courseName);
    studentModel = mongoose.model(courseName,marksSchema);
    const filter = {};
    const all = await studentModel.find(filter);
    console.log(all);
    for(let i=0;i<all.length;i++)
    {
        res.write(`<div class="table-row"><div class="table-data">${all[i].name}</div><div class="table-data">${all[i].marks[0]}</div><div class="table-data">${parseInt(all[i].marks[1])+parseInt(all[i].marks[2])}</div><div class="table-data">${parseInt(all[i].marks[0])+parseInt(all[i].marks[1])+parseInt(all[i].marks[2])}</div></div>`);
    }
    res.write('</div></div></div><script language="JavaScript" type="text/javascript" src="tablescript.js"></script></body></html>');
    res.end();
})

app.get("/xyz",async(req,res)=>{
    let csvString = await fs.readFile(__dirname+"/AMS2630.csv",'utf8');
    const enRegexp = /[ghijklmn]{2}[0-9]{4}/ig;
    const facRegexp = /[0-9]{2}[a-z]{3}[0-9]{3}/ig
    const enArray = csvString.match(enRegexp);
    const facArray = csvString.match(facRegexp);
    for(let i=15;i<facArray.length;i++)
    {
        let en = enArray[i];
        let fac = facArray[i];
        await saveResultInTest(en ,fac);
        let htmlString = await fs.readFile(__dirname+"/public/test",'utf8');
        await savetoDatabase(htmlString);
    }
    res.send('done');
})
app.get("/",async(req,res)=>{
    res.sendFile(__dirname+'/public/home.html');
})


app.listen(port, () => console.log("Server started on port 7000"));




  