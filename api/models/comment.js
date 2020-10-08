const mongoose = require('mongoose');

const commentSchema = mongoose.Schema({
    _id:mongoose.Schema.Types.ObjectId,
    user : {type:mongoose.Schema.Types.ObjectId,require:true,ref:'User'},
    film:{type:mongoose.Schema.Types.ObjectId,ref:'Film'},
    content:{type:String,require:true},
    create_at:{type:Date,require:true,default:Date.now},
    updatedDate: {
        type: Date,
        default: null
    },
})

module.exports = mongoose.model('Comment',commentSchema);