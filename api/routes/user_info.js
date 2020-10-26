const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User_Info = require('../models/user_info');
const auth = require('../middleware/auth');
const User = require('../models/user');


router.get('/all', auth, async (req, res, next) => {
    await User_Info.find()
        .select('name gender dateofbirth user  mobile_phone  _id')
        .exec()
        .then(docs => {
            const respond = {
                count: docs.length,
                user_info: docs.map(doc => {
                    return {
                        name: doc.name,
                        dateofbirth: doc.dateofbirth,
                        mobile_phone: doc.mobile_phone,
                        user:doc.user,
                        gender: doc.gender,
                        _id: doc._id,
                        request: {
                            type: 'GET',
                            url: 'http://localhost:3000/user_info/' + doc._id
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


router.post('/update', auth, async (req, res, next) => {
    // const { mobile_phone } = req.body
    // const userId = req.query.userId;
    // const loginId = req.user._id;
    // //if(loginId == userId){
    // //console.log(req.user._id);
    //     if (mobile_phone.length == 10) {
    //         let user_info;
    //         user_info = await User_Info.find({ user: userId });
    //         user_info.name= req.body.name,
    //         user_info.dateofbirth= new Date(req.body.dateofbirth),
    //         user_info.mobile_phone= req.body.mobile_phone,
    //         user_info.gender= req.body.gender

    //         user_info.save();

            // user_info
            //     .save()
            //     .then(result => {
            //         console.log(result);
            //         res.status(200).json({
            //             message: "Update user info successfully",
            //             createdUserInfo: {
            //                 name: result.name,
            //                 gender: result.gender,
            //                 dateofbirth: result.dateofbirth,
            //                 mobile_phone: result.mobile_phone,
            //                 create_at: result.create_at,
            //                 user:result.user,
            //                 _id: result._id,
            //                 request: {
            //                     type: 'GET',
            //                     url: 'http://localhost:3000/user_info/' + result._id
            //                 }
            //             }

            //         });
            //     })
            //     .catch(err => {
            //         console.log(err);
            //         res.status(500).json({
            //             error: err
            //         })
            //     });
                // let user;
                // user = await User.findById({_id:userId}).exec();
                // user.name = req.body.name;
                // user.save()
        // } else {
        //     res.status(500).json({
        //         message: 'Mobile phone must be less than 11 & at least 10 numbers'
        //     })
        // }
    // }
    // else{
    //     res.status(500).json({
    //         message:'Login Failed'
    //     })
    // }
    if (req.body.mobile_phone.length == 10) {
        const data = { name: req.body.name }
        const userId =req.query.userId
        User_Info.findOne({user:userId},async function(err,user_info){
            let user;
            user = await User.findById(userId)
            user.name = req.body.name;
            await user.save();
            const condition=({_id:user_info._id})
            User_Info.findByIdAndUpdate(condition, req.body, { new: true }).exec()
            .then(result => {
                if (result) {
                    res.status(200).json({
                        user_info: result,
                        request: {
                            type: 'GET',
                            url: 'http://localhost:3000/user_info/' + result._id
                        }
                    });
                } else {
                    res.status(404).json({ message: 'There was a problem updating the user' });
                }
            })
        })
        const user_info = await User_Info.findById(user_infoId)
       // console.log(user_infoId);
    } else {
        res.status(401).json({
            message: 'Mobile must be less than 11 and at least 10 numbers'
        })
    }
   
})


router.get('/user', auth, (req, res, next) => {
    const id = req.query.userId;
    const loginId= req.user._id;
    if(id==loginId){
        User_Info.findOne({user:id})
        .select('name gender dateofbirth user mobile_phone  _id ')
        .populate('user')
        .then(result => {
            console.log("From database", result)
            if (result) {
                res.status(200).json({
                    user_info: result,
                    request: {
                        type: 'GET',
                        url: 'http://localhost:3000/user_info/'
                    }
                });
            } else {
                res.status(404).json({ message: 'No valid entry found for ID' });
            }
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        })
    }else{
        res.status(500).json({
            message:'ID does not match'
        })
    }
})

router.delete('/:userinfoId', function (req, res) {
    User_Info.findByIdAndRemove(req.params.userinfoId, function (err, user) {
        if (err) return res.status(500).send("There was a problem deleting the user.");
        res.status(200).send("User: " + user.name + " was deleted.");
    });
});

router.put('/:userinfoId', auth, async function (req, res) {
    if (req.body.mobile_phone.length == 10) {
        const data = { name: req.body.name }
        const user_info = await User_Info.findById(req.params.userinfoId)
        let user;
        user = await User.findById(user_info.user)
        user.name = req.body.name;
        await user.save();
        User_Info.findByIdAndUpdate(req.params.userinfoId, req.body, { new: true }).exec()
            .then(result => {
                if (result) {
                    res.status(200).json({
                        user_info: result,
                        request: {
                            type: 'GET',
                            url: 'http://localhost:3000/user_info' + result._id
                        }
                    });
                } else {
                    res.status(404).json({ message: 'There was a problem updating the user' });
                }
            })
    } else {
        res.status(401).json({
            message: 'Mobile must be less than 11 and at least 10 numbers'
        })
    }

    // , function (err, user) {
    //     if (err) return res.status(500).send("There was a problem updating the user.");
    //     res.status(200).json({
    //         userUpdate:user
    //     });
    // });
});

module.exports = router;