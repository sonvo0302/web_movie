const express = require('express');
const router = express.Router();
const Rating =require('../models/rating');
const auth =require('../middleware/auth')
const mongoose =require('mongoose');
const Film =require('../models/film')

router.get('/',async(req,res,next)=>{

    await Rating.find()
    .select('user film numberofrating _id').populate('film')
    .exec()
    .then(docs=>{
        const respond = {
            count:docs.length,
            ratings:docs.map(doc=>{
                return{
                    user:doc.user,
                    film:doc.film,
                    numberofrating:doc.numberofrating,
                    _id:doc._id,
                    request:{
                        type:'GET',
                        url:'http://localhost:3000/ratings/'+doc._id
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

router.get('/averageR',async(req,res,next)=>{
    Rating.aggregate(
        [
          {
            $group:
              {
                _id: "$film",
                avgRating: { $avg: "$numberofrating" }
              }
          }
        ]
     ).exec()
     .then(result=>{
            res.status(201).json({
                ratings:result
            })
     })
     .catch(err=>{
         res.status(500).json({
             error:err
         })
     })

})


router.post('/',auth,async(req,res,next)=>{
    const {numberofrating} =req.body
    if(parseFloat(numberofrating) > 5){
        res.status(500).json({
            message:'Rating must be less than or as 5'
        })
    }else{
    const loginId = req.user._id;
    console.log(loginId);
    const rating=new Rating({
        _id:new mongoose.Types.ObjectId(),
        user:loginId,
        film:req.body.filmId,
        numberofrating : req.body.numberofrating
    })
    rating
    .save()
    .then(result=>{
        console.log(result);
        res.status(200).json({
            message:"Create rating successfully",
            createdRating:{
                user:result.user,
                film:result.film,
                numberofrating:result.numberofrating,
                _id:result._id,
                request:{
                    type:'GET',
                    url:'http://localhost:3000/ratings/'+result._id
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
})


module.exports = router