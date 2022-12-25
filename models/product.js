const mongoose=require('mongoose');
const proSchema=new mongoose.Schema({
    name:{ type:String,unique:true,required:true},
    price:{ type:Number, required:true},
    description:{type:String,required:true},
    image:{type:String,required:true},
})
module.exports=mongoose.model("product",proSchema);