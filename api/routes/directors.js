const express= require('express');
const router = express.Router();
const mongoose =require('mongoose');
const Director =require('../models/director');
const Film=require('../models/film');

router.get('/',async(req,res,next)=>{
    Director.find()
    .select('full_name mobile_phone dateofbirth  _id')
    .exec()
    .then(docs=>{
        const respond = {
            count:docs.length,
            directors:docs.map(doc=>{
                return{
                     full_name:doc.full_name,
                     mobile_phone:doc.mobile_phone,
                     dateofbirth:doc.dateofbirth,
                    _id:doc._id,
                    request:{
                        type:'GET',
                        url:'http://localhost:3000/directors/'+doc._id
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
    const {mobile_phone} =req.body
    if(mobile_phone.length == 10){
    const director=new Director({
        _id:new mongoose.Types.ObjectId(),
        full_name:req.body.full_name,
        dateofbirth:new Date(req.body.dateofbirth),
        mobile_phone:req.body.mobile_phone
    })
    director
    .save()
    .then(result=>{
        console.log(result);
        res.status(200).json({
            message:"Created director successfully",
            createdDirector:{
                full_name:result.full_name,
                dateofbirth:result.dateofbirth,
                mobile_phone:result.mobile_phone,
                _id:result._id,
                request:{
                    type:'GET',
                    url:'http://localhost:3000/directors/'+result._id
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
    return res.status(500).json({
        message:'Mobile phone must be small than 11 & at least 10 numbers'
    })
}
})

router.get('/:directorId',async(req,res,next)=>{
    const id = req.params.directorId;
    const director =await  Director.findById(id)
    const films =await  Film.find({ director: director.id }).exec()
   await Director.findById(id)
    .select('full_name mobile_phone dateofbirth _id')
    .exec()
    .then(doc=>{
        console.log("From database",doc)
        if(doc){
            res.status(200).json({
                director:doc,
                films:films,
                request:{
                    type:'GET',
                    url:'http://localhost:3000/directors'
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


module.exports = router;