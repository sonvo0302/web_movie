const express =require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Gender =require('../models/gender');
const checkAuth=require('../middleware/check-auth');



//Handling incoming GET requests to /categories
router.get('/',async(req,res,next)=>{
    await Gender.find()
    .select('type _id')
    .exec()
    .then(docs=>{
        const respond = {
            count:docs.length,
            genders:docs.map(doc=>{
                return{
                     type:doc.type,
                    _id:doc._id,
                    request:{
                        type:'GET',
                        url:'http://localhost:3000/genders/'+doc._id
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
//Handling POST requests to /categories
router.post('/',async(req,res,next)=>{
    const gender=new Gender({
        _id:new mongoose.Types.ObjectId(),
        type:req.body.type
    })
    gender
    .save()
    .then(result=>{
        console.log(result);
        res.status(200).json({
            message:"Create gender successfully",
            createdGender:{
                type:result.type,
                _id:result._id,
                request:{
                    type:'GET',
                    url:'http://localhost:3000/genders/'+result._id
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
})

router.get('/:genderId',async(req,res,next)=>{    
    const id = req.params.genderId;
    await Gender.findById(id)
    .select('name _id')
    .exec()
    .then(doc=>{
        console.log("From database",doc)
        if(doc){
            res.status(200).json({
                gender:doc,
                request:{
                    type:'GET',
                    url:'http://localhost:3000/genders'
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


module.exports =router;