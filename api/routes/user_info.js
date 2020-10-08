const express= require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt=require('bcryptjs');
const User_Info =require('../models/user_info');
const auth = require('../middleware/auth');


router.get('/',auth,async(req,res,next)=>{
    await User_Info.find()
    .select('name gender dateofbirth user mobile_phone  _id')
    .exec()
    .then(docs=>{
        const respond = {
            count:docs.length,
            user_info:docs.map(doc=>{
                return{
                     name:doc.name,
                     dateofbirth:doc.dateofbirth,
                     mobile_phone:doc.mobile_phone,
                     user:doc.user,
                     gender:doc.gender,
                    _id:doc._id,
                    request:{
                        type:'GET',
                        url:'http://localhost:3000/user_info/'+doc._id
                    }
                }
            })
        }
        //if(docs.length>=0){
            res.status(200).json(respond)
        // }else{
        //     res.status(400).json({
        //         message:'No entries found'
        //     });
        // }
    })
    .catch(err=>{
        console.log(err);
        res.status(500).json({
            error:err
        });
    });
})


router.post('/',auth,async(req,res,next)=>{
    const {mobile_phone} =req.body
    const loginId = req.user._id;
    const user_info = await User_Info.find({user:loginId}).exec()
    console.log(req.user._id);
    if(user_info.length == ''){
        if(mobile_phone.length==10){
            const user_info=new User_Info({
                _id : new mongoose.Types.ObjectId(),
                name:req.user.name,
                dateofbirth:new Date(req.body.dateofbirth),
                mobile_phone:req.body.mobile_phone,
                gender : req.body.gender,
                user:loginId
            })
            user_info
            .save()
            .then(result=>{
                console.log(result);
                res.status(200).json({
                    message:"Created user info successfully",
                    createdUserInfo:{
                        name:result.name,
                        gender:result.gender,
                        dateofbirth:result.dateofbirth,
                        mobile_phone:result.mobile_phone,
                        create_at:result.create_at,
                        user:result.user,
                        _id:result._id,
                        request:{
                            type:'GET',
                            url:'http://localhost:3000/user_info/'+result._id
                        }
                    }
        
                });
            })
            .catch(err=>{
                console.log(err);
                res.status(500).json({
                    error:err
                })
            });
        }else{
            res.status(500).json({
                message:'Mobile phone must be small than 11 & at least 10 numbers'
            })
        }
    }else{
        res.status(500).json({
            message:'user info exist'
        })
    }
})


router.get('/:userinfoId',auth,(req,res,next)=>{
    const id = req.params.userinfoId;
    User_Info.findById(id)
    .select('name gender dateofbirth user mobile_phone  _id ')
    .populate('user')
    .then(result=>{
        console.log("From database",result)
        if(result){
            res.status(200).json({
                user_info:result,
                request:{
                    type:'GET',
                    url:'http://localhost:3000/user_info'
                }
            });
        }else{
            res.status(404).json({message:'No valid entry found for ID'});
        }
    })
    .catch(err=>{
        res.status(500).json({
            error:err
        })
    })
})

router.delete('/:userinfoId', function (req, res) {
    User_Info.findByIdAndRemove(req.params.userinfoId, function (err, user) {
        if (err) return res.status(500).send("There was a problem deleting the user.");
        res.status(200).send("User: "+ user.name +" was deleted.");
    });
});

router.put('/:userinfoId', /* VerifyToken, */ function (req, res) {
    User_Info.findByIdAndUpdate(req.params.userinfoId, req.body, {new: true}).exec()
    .then(result=>{
        if(result){
            res.status(200).json({
                user_info:result,
                request:{
                    type:'GET',
                    url:'http://localhost:3000/user_info'+result._id
                }
            });
        }else{
            res.status(404).json({message:'There was a problem updating the user'});
        }
    })
    // , function (err, user) {
    //     if (err) return res.status(500).send("There was a problem updating the user.");
    //     res.status(200).json({
    //         userUpdate:user
    //     });
    // });
});

module.exports = router;