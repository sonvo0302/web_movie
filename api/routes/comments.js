const express = require('express');
const router = express.Router();
const Comment = require('../models/comment');
const auth = require('../middleware/auth')
const mongoose = require('mongoose');
const Film = require('../models/film')


router.get('/all', auth, async (req, res, next) => {

    await Comment.find()
        .select('user film content updatedDate create_at _id').populate('film')
        .exec()
        .then(docs => {
            const respond = {
                count: docs.length,
                comments: docs.map(doc => {
                    return {
                        user: doc.user,
                        film: doc.film,
                        content: doc.content,
                        updatedDate: doc.updatedDate,
                        create_at: doc.create_at,
                        _id: doc._id,
                        request: {
                            type: 'GET',
                            url: 'http://localhost:3000/comment/' + doc._id
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

router.post('/film', auth, async (req, res, next) => {
    const filmId_new = req.query.filmId;
    const { content } = req.body
    const loginId = req.user._id;
    console.log(loginId);
    const film_user_comment = await Comment.find({ user: loginId, film: filmId_new });
    if (film_user_comment.length == '') {
        const comment = new Comment({
            _id: new mongoose.Types.ObjectId(),
            user: loginId,
            film: filmId_new,
            content: req.body.content
        })
        comment
            .save()
            .then(result => {
                console.log(result);
                res.status(200).json({
                    message: "Create comment successfully",
                    createdRating: {
                        user: result.user,
                        film: result.film,
                        content: result.content,
                        create_at: result.create_at,
                        updatedDate: result.updatedDate,
                        _id: result._id,
                        request: {
                            type: 'GET',
                            url: 'http://localhost:3000/comment/' + result._id
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
        Comment.findOne({ film: filmId_new, user: loginId }, function (err, comment) {
            if (err) throw err;
            const condition = { _id: comment._id }
            const dataForUpdate = { content: req.body.content,updatedDate:Date.now().toString() }
            Comment.findOneAndUpdate(condition, dataForUpdate, { new: true }).exec()
                .then(result => {
                    if (result) {
                        res.status(200).json({
                            comment: result,
                            request: {
                                type: 'GET',
                                url: 'http://localhost:3000/comment/' + result._id
                            }
                        });
                    } else {
                        res.status(404).json({ message: 'There was a problem updating rating' });
                    }
                })
        })
    }
})

router.get('/:commentId', async (req, res, next) => {

    const id = req.params.commentId;
    Comment.findById(id)
        .select('film user _id content')
        .populate('film user')
        .exec()
        .then(doc => {
            //console.log("From database",doc)
            if (doc) {
                res.status(200).json({
                    comment: doc,
                    request: {
                        type: 'GET',
                        url: 'http://localhost:3000/comment'
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
    // Film.findById(id).populate("ratings").exec(function(err, showMovie){
    //     if(err){
    //         console.log(err);
    //     } else{
    //         var total = 0;
    //         for(var i = 0; i < showMovie.ratings.length; i++) {
    //             total = total + showMovie.ratings[i].numberofrating;
    //         }
    //         var avg = total / showMovie.ratings.length;
    //         res.status(200).json( {movie: showMovie, ratingAverage: ratingId});
    //     }
    //  }); 

})


router.put('/edit/:commentId', (req, res, next) => {
    const dataForUpdate = { content: req.body.content, updatedDate: Date.now().toString() }
    Comment.findByIdAndUpdate(req.params.commentId, dataForUpdate, { new: true }).exec()
        .then(result => {
            if (result) {
                res.status(200).json({
                    comment: result,
                    request: {
                        type: 'GET',
                        url: 'http://localhost:3000/comment' + result._id
                    }
                });
            } else {
                res.status(404).json({ message: 'There was a problem updating the comment' });
            }
        })
});

router.delete('/delete/:commentId', (req, res, next) => {
    const id = req.params.commentId;
    Comment.remove({ _id: id })
        .exec()
        .then(result => {
            res.status(200).json({
                message: 'Comment Deleted',
                request: {
                    type: 'POST',
                    url: 'http://localhost:3000/comment',
                    body: {
                        user: 'userId',
                        film: 'filmId',
                        content: 'String',
                        create_at: 'Datetime'
                    }
                }
            });
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
});

module.exports = router
