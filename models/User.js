const mongoose=require("mongoose");

const userSchema=new mongoose.Schema({

    //id do not need cause mongodb will automatically generate an _id field for each document
    
    fullName:{
        type:String,
        required: true,
        trim: true
    },
    email:{
        type:String,
        required: true,
        unique:true,
        trim: true,
        
    },
    password:{
        type:String,
        required: true,
    
    }
},
{
    timestamps:true
}

);

module.exports=mongoose.model("User",userSchema);