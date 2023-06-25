const express = require("express");
const jsdom = require('jsdom')
const bodyParser = require('body-parser');
const { async } = require("jshint/src/prod-params");
const fs = require('fs').promises;
const marksSchema = require('./server/models/marksSchema')
const metaSchema = require('./server/models/metaSchema')
const mongoose = require('mongoose');
const { type } = require("os");
const multer = require('multer');
const path = require('path');
XLSX = require('xlsx');

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
let port = "7000"
// app.set('view engine', 'ejs');
// app.set('views',__dirname + '/views');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json())
app.use(bodyParser.urlencoded({limit: '5000mb', extended: true, parameterLimit: 100000000000}));

let excelFilePathGlobal;

async function calltoServerCount()
{
    metaModel = mongoose.model('meta',metaSchema);
    const filter = {_id:'count'};
    const metaDoc = await metaModel.findOne(filter);
    let count = metaDoc.calltoServerCount;
    count++;
    const update = { "$set": {
        calltoServerCount:count
    }};
    await metaModel.findOneAndUpdate(filter, update);
}


async function saveResultFromRpunit(en ,fac)
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
    await fs.writeFile(__dirname+"/public/studentResult", text, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("The file was saved!");
    }); 
    // console.log(text);
}
async function savetoDatabase(res,htmlString)
{
    let dom = new jsdom.JSDOM(htmlString);
    let tbody = dom.window.document.querySelector(".table-responsive").children[0].children[0];
    let infoRow = dom.window.document.querySelector(".table-responsive").children[1].children[0].children[1];
    if(infoRow.children[0]===undefined)return;
    let fac = infoRow.children[0].textContent;
    let en = infoRow.children[1].textContent;
    let studentName = infoRow.children[2].textContent;
    res.send(studentName);
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
            fac: fac,
            name: studentName,
            marks:[sessionalMarks,examMarks,graceMarks]
        }};
        studentModel = mongoose.model(courseName,marksSchema);
        const doesUserExist = await studentModel.exists(filter);
        if(doesUserExist)return 1;
        else
        {
            await studentModel.findOneAndUpdate(filter, update,{upsert: true});
            return 0;
        }
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
        res.write(`<div class="table-row"><div class="table-data">${all[i].name}</div><div class="table-data">${all[i].marks[0]}</div><div class="table-data">${parseInt(all[i].marks[1])+parseInt(all[i].marks[2])}</div>`)
        res.write(`<div class="table-data">${parseInt(all[i].marks[0])+parseInt(all[i].marks[1])+parseInt(all[i].marks[2])}</div></div>`);
    }
    res.write('</div></div></div><script language="JavaScript" type="text/javascript" src="tablescript.js"></script></body></html>');
    res.end();
})

app.get("/get_from_server",async(req,res)=>{
    console.log(excelFilePathGlobal);
    let alreadyPresentInServer=0,numberofErrors=0;
    let csvString = await fs.readFile(path.join(__dirname,'uploadedCSV','uploadedCSVFile'),'utf8');
    const enRegexp = /[a-z]{2}[0-9]{4}/ig;
    const facRegexp = /[0-9]{2}[a-z]{3}[0-9]{3}/ig
    const enArray = csvString.match(enRegexp);
    const facArray = csvString.match(facRegexp);
    // console.log(facArray.length,enArray.length)
    
    if(facArray===null||enArray===null)
    return res.sendFile(__dirname+'/public/excelFileUnreadable.html');

    arrayLength = facArray.length;
    if(arrayLength>100)return res.sendFile(__dirname+'/public/excelFileSizeExceed.html');
    //dangerzone-start
    for(let i=0;i<arrayLength;i++)
    {
        if(alreadyPresentInServer>5||numberofErrors>5)return res.sendFile(__dirname+'/public/alreadypresent.html')
        let en = enArray[i];
        let fac = facArray[i];
        try{
            await calltoServerCount();//keeping track of calls to rp unit server
            await saveResultFromRpunit(en ,fac);
            let htmlString = await fs.readFile(__dirname+"/public/studentResult",'utf8');
            let doesUserExist = await savetoDatabase(res,htmlString);
            alreadyPresentInServer+=doesUserExist;
        }
        catch(error)
        {
            numberofErrors++;
        }
    }
    //dangerzone-end
    res.send('done');
})

const excelStorage = multer.diskStorage({
    // Destination to store csv     
    destination: 'uploadedExcel', 
      filename: (req, file, cb) => {
        excelFilePathGlobal = path.join(__dirname , "uploadedExcel" ,"uploadedExcelFile" + path.extname(file.originalname));
        cb(null, 'uploadedExcelFile'+path.extname(file.originalname))
    }
});
const excelUpload = multer({
    storage: excelStorage,
    limits: {
      fileSize: 5000000 //5MB
    }
})

app.post('/upload_excel', excelUpload.single('excelupload'), (req, res) => {
    const workBook = XLSX.readFile(excelFilePathGlobal);
    XLSX.writeFile(workBook, 'uploadedCSV/uploadedCSVFile', { bookType: "csv" });
    res.redirect("/get_from_server");
})



app.get("/",(req,res)=>{
    res.sendFile(__dirname+'/public/home.html')
})

app.listen(port, () => console.log("Server started on port 7000"));






  