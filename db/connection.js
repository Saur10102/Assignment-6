//database connection
const mongoose = require('mongoose')
mongoose.connect("mongodb://127.0.0.1:27017/Assignment6")
    .then(res => console.log("MongoDB Connected"))
    .catch(err => console.log("Error : " + err));
//end