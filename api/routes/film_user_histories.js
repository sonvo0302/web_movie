const express =require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Film_User_History = require('../models/film_user_history');
const mongoose=require('mongoose');

router.get('/all',auth,(req,res)=>{
    Film_User_History
    .find().select('user film __id')
    .then(docs => {

        const respond = {
            count: docs.length,
            film_user_histories: docs.map(doc => {
                return {
                    user:doc.user,
                    film:doc.film,
                    _id: doc._id,
                    request: {
                        type: 'GET',
                        url: 'http://localhost:3000/film_user_history/' + doc._id
                    }
                }
            }),

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
        })
    });

})
router.get('/user', auth, async (req, res, next) => {
    const id = req.query.userId;
    const loginId = req.user._id
    if(id==loginId){
    // const film_user_history = await Film_User_History.findOne({user:id})   
        Film_User_History.find({user:id})
            .select('_id user film ')
            .populate(' film ')
            .exec()
            .then(doc => {
                //console.log("From database",doc)
                if(doc){
                    res.status(200).json({
                        film_user_history: doc,
                        request: {
                            type: 'GET',
                            url: 'http://localhost:4000/film_user_history/'
                        }
                    });
                } else {
                    res.status(404).json({ message: 'No valid entry found for ID' });
                }
            })
            .catch(err => {
                console.log(err);
                res.status(500).json({ error: err });
            });
        }else{
            res.status(500).json({
                message:'ID does not match'
            })
        }
})


module.exports = router