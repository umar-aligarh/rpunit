const express = require("express");
const jsdom = require('jsdom')
const bodyParser = require('body-parser');
const { async } = require("jshint/src/prod-params");
const fs = require('fs').promises;

const app = express();

app.set('view engine', 'ejs');
app.set('views',__dirname + '/views');

app.use('/static', express.static('public'));
app.use(express.json())
app.use(bodyParser.urlencoded({limit: '5000mb', extended: true, parameterLimit: 100000000000}));

let port = "3000"

app.get("/",async(req,res)=>{
    // fac='20cob315'
    // en='gl9623'
    // const url = "https://ctengg.amu.ac.in/web/table_result010.php";
    // const response = await fetch(url, {
    //     method: 'POST',
    //     headers: {
    //     'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    //     'Referer': 'https://ctengg.amu.ac.in/web/st_result001.php?prog=btech'
    // },
    // body: "fac=20cob315&en=gl9623&prog=btech"
    // })
    // // console.log(response);
    // const text = await response.text();
    // await fs.writeFile(__dirname+"/public/test", text, function(err) {
    //     if(err) {
    //         return console.log(err);
    //     }
    //     console.log("The file was saved!");
    // }); 
    // console.log(text);
    let text = await fs.readFile(__dirname+"/public/test",'utf8')
    // console.log(text);
    // console.log(typeof(text));

    let dom = new jsdom.JSDOM(text);
    console.log(dom.window.document.body.children[2].children[0].children[1].innerHTML);
    res.send('done');

    // console.log(text);
    // let dom = new jsdom.JSDOM(text)
    // console.log(dom.window.document.body.textContent);
    // console.log(dom);
    // let table = dom.window.document.querySelector(".table-responsive"); 
    // console.log(table);


})


app.listen(port, () => console.log("Server started on port 3000"));




  