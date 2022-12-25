const express=require('express');
const exphbs=require('express-handlebars');
const app = express();

//server
require('dotenv').config()
PORT=process.env.PORT

//db
require('./db/connection')

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(express.static(__dirname + '/public'));

// template engines
app.engine('handlebars',exphbs.engine())
app.set('view engine','handlebars');
app.set('views','./views');

//routes
const mainRoute = require('./routes/mainRouter')
const userRoute = require('./routes/usersRouter')

app.use("/",mainRoute)
app.use("/user",userRoute);
app.use("*",(req,res)=>{
    res.render("notfound")
})

app.listen(PORT,(err)=>{
    if(err) throw err;
    else console.log(`server work on ${PORT}`)
})