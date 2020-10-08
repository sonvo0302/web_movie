const express= require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt=require('bcryptjs');
const User =require('../models/user2')
const User_Info=require('../models/user_info')
const jwt =require('jsonwebtoken');
const checkAuth = require('../middleware/check-auth');
const config= require('../config.json')

router.get('/',async(req,res,next)=>{
    await User.find()
    .select('email password _id')
    .exec()
    .then(docs=>{
        const respond = {
            count:docs.length,
            users:docs.map(doc=>{
                return{
                     email:doc.email,
                     password:doc.password,
                    _id:doc._id,
                    request:{
                        type:'GET',
                        url:'http://localhost:3000/user/'+doc._id
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




router.post('/signup',async(req,res,next)=>{
    if(req.body.password !== req.body.confirmpassword){
        return res.status(500).json({
            message:'Password not matched'
        })
    }else{
        User.find({username:req.body.username})
        .exec()
        .then(user=>{
            if(user.length >=1 ){
                return res.status(422).json({
                    message:'Username exist'
                })
            }
            else{
    User.find({email:req.body.email})
    .exec()
    .then(user=>{
        if(user.length >=1 ){
            return res.status(422).json({
                message:'Email exist'
            })
        }
        else{
            bcrypt.genSalt(10, function(err, salt) {
                bcrypt.hash(req.body.password, salt, function(err, hash) {
                    if(err){
                        return res.status(500).json({
                            error:err
                        })
                    }else{
                        const user=new User({
                            _id:new mongoose.Types.ObjectId(),
                            username:req.body.username,
                            email:req.body.email,
                            password : hash
                        })
            
                        user
                        .save()
                        .then(result=>{
                            console.log(result);
                            res.status(200).json({
                                message:"Created category successfully",
                                createdUser:{
                                    username:result.username,
                                    email:result.email,
                                    password:result.password,
                                    _id:result._id,
                                    request:{
                                        type:'GET',
                                        url:'http://localhost:3000/user/'+result._id
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
                    }
                });
            }); 
        }
    })

}
    }).catch(err=>{
        res.status(500).json({error:err})
    })
}
})

router.post('/login',async(req,res,next)=>{
    User.find({username:req.body.username})
    .exec()
    .then(user=>{
        //const user_info =  User_Info.find({_id: user.id }).limit(6).exec()
        if(user.length < 1){
            return res.status(401).json({
                message:'User not exists'
            })
        }else{
            bcrypt.compare(req.body.password, user[0].password, function(err, result) {
                if(err){
                    return res.status(401).json({
                        message:'Auth failed'
                    })
                }
                if(result){
                    const token = jwt.sign({
                        username:user[0].username,
                        userId:user[0]._id,
                    },process.env.JWT_KEY,{expiresIn:"1h"})
                   
                    res.status(200).json({
                        message:'Login Successful',
                        user:user,
                        token:token,
                        auth:true
                    })
                }else{
                    return res.status(404).json({
                        message:'Auth failed'
                    })
                }
            });
        
    }
                
    })
    .catch(err=>{
        console.log(err);
        res.status(500).json({error:err});
    })
})




router.get('/logout',checkAuth, function(req, res) {
    User.update({$unset : {token :1}}).exec()
    .then(result=>{
            if(!result) return res.status(400).json({
                message:'Logout failed'
            });
            res.status(200).json({
                user:result 
            });
        })
    })


router.get('/:userId',async(req,res,next)=>{    
    const id = req.params.userId;
    const user =await  User.findById(id)
    const user_info =await  User_Info.find({ userId: user.id }).exec()
    await User.findById(id)
    .select('email password _id')
    .exec()
    .then(doc=>{
        console.log("From database",doc)
        if(doc){
            res.status(200).json({
                user:doc,
                user_info:user_info,
                request:{
                    type:'GET',
                    url:'http://localhost:3000/user'
                }
            });
        }else{
            res.status(404).json({message:'No valid entry found for ID'});
        }
    })
    .catch(err=>{
        console.log(err);
        res.status(500).json({error:err});
    });
})











// router.delete('/:userId',async(req,res,next)=>{
//     User.remove({_id:req.params.userId})
//     .exec()
//     .then(result=>{
//         res.status(201).json({
//             message:'User Deleted',
//             request:{
//                 type:'POST',
//                 url:'http://localhost:3000/user',
//                 body:{
//                     email:'String',
//                     password:'String'
//                 }
//             }
//         })
//     })
//     .catch(err=>{
//         console.log(err);
//         res.status(500).json({
//             error:err
//         })
//     })
// })

module.exports = router;
