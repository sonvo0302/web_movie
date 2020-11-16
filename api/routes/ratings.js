const express = require('express');
const router = express.Router();
const Rating = require('../models/rating');
const auth = require('../middleware/auth')
const mongoose = require('mongoose');
const Film = require('../models/film')

router.get('/all', auth, async (req, res, next) => {

    await Rating.find()
        .select('user film numberofrating _id').populate('film')
        .exec()
        .then(docs => {
            const respond = {
                count: docs.length,
                ratings: docs.map(doc => {
                    return {
                        user: doc.user,
                        film: doc.film,
                        numberofrating: doc.numberofrating,
                        _id: doc._id,
                        request: {
                            type: 'GET',
                            url: 'http://localhost:3000/rating/' + doc._id
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
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
})

// router.get('/averageR',async(req,res,next)=>{
//     Rating.aggregate(
//         [
//           {
//             $group:
//               {
//                 _id: "$film",
//                 avgRating: { $avg: "$numberofrating" }
//               }
//           }
//         ]
//      ).exec()
//      .then(result=>{

//             res.status(201).json({
//                 ratings:result
//             })

//      })
//      .catch(err=>{
//          res.status(500).json({
//              error:err
//          })
//      })

// })


router.post('/film', auth, async (req, res) => {
    try {
        const filmId_add = req.query.filmId
        const number_add = req.query.numberofrating
        const loginId = req.user._id;
        //console.log(loginId);

        //const {numberofrating} =req.body
        if (parseFloat(number_add) > 5) {
            res.status(400).json({
                message: 'Rating must be less than or as 5'
            })
        } else {

            const user_rating = await Rating.find({ user: loginId, film: filmId_add });
            // const rating_user =await Rating.find({ user: loginId, film: filmId_add }).exec();
            if (user_rating.length == '') {
                const rating = new Rating({
                    _id: new mongoose.Types.ObjectId(),
                    user: loginId,
                    film: filmId_add,
                    numberofrating: number_add
                })
                rating
                    .save()
                    .then(result => {
                        console.log(result);
                        res.status(200).json({
                            message: "Create rating successfully",
                            createdRating: {
                                user: result.user,
                                film: result.film,
                                numberofrating: result.numberofrating,
                                _id: result._id,
                                request: {
                                    type: 'GET',
                                    url: 'http://localhost:4000/rating/' + result._id
                                }
                            }

                        });
                    })
                    .catch(err => {
                        console.log(err);
                        res.status(500).json({
                            error: err
                        })
                    });
            } else {
                Rating.findOne({ film: filmId_add, user: loginId }, function (err, rating) {
                    if (err) throw err;
                    const condition = { _id: rating._id }
                    const dataForUpdate = { numberofrating: number_add }
                    Rating.findOneAndUpdate(condition, dataForUpdate, { new: true }).exec()
                        .then(result => {
                            if (result) {
                                res.status(200).json({
                                    rating: result,
                                    request: {
                                        type: 'GET',
                                        url: 'http://localhost:4000/rating/' + result._id
                                    }
                                });
                            } else {
                                res.status(404).json({ message: 'There was a problem updating rating' });
                            }
                        })
                })
            }
        }
    } catch (err) {
        res.status(500).json({
            message: err
        })
    }
})


module.exports = router