const mongoose = require('mongoose');


const userinfoSchema = mongoose.Schema({
    _id:{type:mongoose.Schema.ObjectId},
    user : {type:mongoose.Schema.Types.ObjectId,require:true,unique:true,ref:'User'},
    name : {type:String,require:true},
    dateofbirth:{type:Date,require:true,defaut:null},
    mobile_phone : {type:String,require:true,defaut:null},
    gender:{type:Boolean,require:true,defaut:null},
    create_at:{type:Date,require:true,default:Date.now}
})


module.exports = mongoose.model('User_Info',userinfoSchema)