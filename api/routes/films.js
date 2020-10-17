const express = require('express');
const router = express.Router();
const path = require('path')
const fs = require('fs')
const mongoose = require('mongoose');
const multer = require('multer');
const auth = require('../middleware/auth');
const Film = require('../models/film');
const Rating = require('../models/rating');
const Category = require('../models/category');
const Director = require('../models/director');
const FilmsController = require('../controllers/film');
const db = mongoose.connection;
const Comment = require('../models/comment');
const Film_User_History = require('../models/film_user_history');



const uploadPath = path.join('public', Film.coverImageBasePath)


const imageMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'images/gif']
const upload = multer({
    dest: uploadPath,
    fileFilter: (req, file, callback) => {
        callback(null, imageMimeTypes.includes(file.mimetype))
    }
})
// const storage = multer.diskStorage({
//     destination: function(req, file, cb) {
//       cb(null, './uploads/');
//     },
//     filename: function(req, file, cb) {
//       cb(null, file.originalname);
//     }
//   });


//   const upload = multer({
//     storage: storage,
//     limits: {
//       fileSize: 1024 * 1024 * 5
//     },
//     fileFilter: (req, file, callback) => {
//             callback(null, imageMimeTypes.includes(file.mimetype))
//           }
//   });





router.get('/search', async (req, res, next) => {
    const regex = new RegExp(req.query.name, 'i');
    Film.find({ name: regex })
        .then(result => {
            res.status(201).json(result)
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        })
})

router.get('/', auth, async (req, res, next) => {

    Film.find().sort({ publishDate: 'desc' })
        .select('name publishDate description cast coverImageName' +
            'director category linkTrailer create_at _id')
        .exec()
        .then(docs => {

            const respond = {
                count: docs.length,
                films: docs.map(doc => {
                    return {
                        name: doc.name,

                        publishDate: doc.publishDate,
                        description: doc.description,
                        create_at: doc.create_at,
                        cast: doc.cast,
                        coverImageName: doc.coverImageName,
                        director: doc.director,
                        category: doc.category,
                        linkTrailer: doc.linkTrailer,
                        _id: doc._id,
                        request: {
                            type: 'GET',
                            url: 'http://localhost:3000/films/' + doc._id
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
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
});

// function search(query) {
//     return function(element) {
//       for(var i in query) {
//         if(query[i] != element[i]) {
//           return false;
//         }
//       }
//       return true;
//     }
//   }

//   exports.search = function(query) {
//     return films.filter(search(query));
// }

router.post('/', auth, upload.single('coverImageName'), async (req, res, next) => {
    // const {rating} =req.body
    // if(parseFloat(rating) > 5){
    //     res.status(500).json({
    //         message:'Rating must be less than or as 5'
    //     })
    // }else{
    // Category.findById(req.body.categoryId)
    // .then(category=>{
    //     if(!category){
    //         res.status(404).json({
    //             message:'Category not found'
    //         })
    //     }
    //     Director.findById(req.body.directorId)
    //     .then(director=>{
    //         if(!director){
    //             res.status(404).json({
    //                 message:'Director not found'
    //             })
    //         }
    const fileName = req.file != null ? req.file.filename : null
    const film = new Film({
        _id: new mongoose.Types.ObjectId(),
        name: req.body.name,
        coverImageName: fileName,
        //rating :req.body.rating,
        publishDate: req.body.publishDate,
        description: req.body.description,
        linkTrailer: req.body.linkTrailer,
        cast: req.body.cast,
        category: req.body.categoryId,
        director: req.body.directorId
    })
    film.save()
        .then(result => {
            res.status(200).json({
                message: "Created film successfully",
                createdFilm: {
                    name: result.name,

                    publishDate: result.publishDate,
                    description: result.description,
                    create_at: result.create_at,
                    cast: result.cast,
                    coverImageName: result.coverImageName,
                    director: result.director,
                    category: result.category,
                    linkTrailer: result.linkTrailer,
                    _id: result._id,
                    request: {
                        type: 'GET',
                        url: 'http://localhost:3000/films/' + result._id
                    }
                }

            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        })
    //     })
    //     .catch(err=>{
    //         res.status(500).json({
    //             message:'Director not found',
    //             error:err
    //         })
    //     })

    // })
    // .catch(err=>{
    //     res.status(500).json({
    //         message:'Category not found',
    //         error:err
    //     })
    // })

    // }
})



router.get('/:filmId', auth, async (req, res, next) => {
    const id = req.params.filmId;
    const film = await Film.findById(id)
    const rating = await Rating.find({ film: film.id }).exec();
    const comment = await Comment.find({ film: film.id }).exec();
    Rating.aggregate([
        { $unwind: "$film" },
        {
            $group: {
                "_id": "$film",
                "ratingAvg": { "$avg": "$numberofrating" }
            }
        }
    ], function (err, results) {
        if (err) handleError(err);
        Film.populate(results, { "path": "_id" }, function (err, result) {
            if (err) handleError(err);
            console.log(result);
        });
    })
    const loginId = req.user._id;
    console.log(loginId)
    const film_user_histories =await Film_User_History.find({film:film.id,user:loginId});
    if( film_user_histories.length==''){
   
        const film_user_history = new Film_User_History({
            _id: new mongoose.Types.ObjectId(),
            user: loginId,
            film: req.params.filmId
        })
        
        film_user_history.save()
        
        Film.findById(id)
            .select('name publishDate description cast coverImageName' +
                ' director category linkTrailer create_at _id')
            .populate('category director ')
            .exec()
            .then(doc => {
                //console.log("From database",doc)
                if (doc) {
                    var total = 0;
                    for (var i = 0; i < rating.length; i++) {
                        total += rating[i].numberofrating;
                    }
                    var avg = 0
                    if (rating.length == '') {
                        avg = 0
                    } else {
                        avg = total / rating.length;
                    }


                    res.status(200).json({
                        film: doc,
                        rating: rating,
                        comment: comment,
                        averageRating: avg,
                        request: {
                            type: 'GET',
                            url: 'http://localhost:3000/films'
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
            Film.findById(id)
            .select('name publishDate description cast coverImageName' +
                ' director category linkTrailer create_at _id')
            .populate('category director ')
            .exec()
            .then(doc => {
                //console.log("From database",doc)
                if (doc) {
                    var total = 0;
                    for (var i = 0; i < rating.length; i++) {
                        total += rating[i].numberofrating;
                    }
                    var avg = 0
                    if (rating.length == '') {
                        avg = 0
                    } else {
                        avg = total / rating.length;
                    }


                    res.status(200).json({
                        film: doc,
                        rating: rating,
                        comment: comment,
                        averageRating: avg,
                        request: {
                            type: 'GET',
                            url: 'http://localhost:3000/films'
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
        }
    // const rating =await Rating.aggregate(
    //     [
    //       { "$unwind": "$film" },
    //       {
    //         $group:
    //           {
    //             _id: "$film",
    //             avgRating: { $avg: "$numberofrating" }
    //           }
    //       }
    //     ]
    //  ).exec();


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

router.put('/:filmId', auth, upload.single('coverImageName'), async (req, res, next) => {
    // const id =req.params.filmId
    // const updateOps={};
    // for(const ops of req.body){
    //     updateOps[ops.propName]=ops.value;   
    // }
    // Film.update({_id:id},{$set:updateOps})
    // .exec()
    // .then(result=>{

    //     res.status(200).json({
    //         message:'Film updated',
    //         request:{
    //             type:'GET',
    //             url:'http://localhost:3000/films/'+id
    //         }
    //     });
    // })
    // .catch(err=>{
    //     console.log(err);
    //     res.status(500).json({
    //         error:err
    //     });
    // });
    let film;
    film = await Film.findById(req.params.filmId)
    const rating = await Rating.find({ film: film.id }).exec();
    const comment = await Comment.find({ film: film.id }).exec();

    const fileName = req.file != null ? req.file.filename : null

    film.name = req.body.name,
        film.coverImageName = fileName,
        //rating :req.body.rating,
        film.publishDate = req.body.publishDate,
        film.description = req.body.description,
        film.linkTrailer = req.body.linkTrailer,
        film.cast = req.body.cast,
        film.category = req.body.categoryId,
        film.director = req.body.directorId

    film.save()
        .then(result => {
            if (result) {
                var total = 0;
                for (var i = 0; i < rating.length; i++) {
                    total += rating[i].numberofrating;
                }
                var avg = 0
                if (rating.length == '') {
                    avg = 0
                } else {
                    avg = total / rating.length;
                }
                res.status(200).json({
                    message: "Created film successfully",
                    createdFilm: {
                        name: result.name,
                        publishDate: result.publishDate,
                        description: result.description,
                        create_at: result.create_at,
                        cast: result.cast,
                        coverImageName: result.coverImageName,
                        director: result.director,
                        category: result.category,
                        linkTrailer: result.linkTrailer,
                        rating: rating,
                        comment: comment,
                        ratingAverage: avg,
                        _id: result._id,
                        request: {
                            type: 'GET',
                            url: 'http://localhost:3000/films/' + result._id
                        }
                    }

                });
            }
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        })
    //     })



});

router.delete('/:filmId', (req, res, next) => {
    const id = req.params.filmId;
    Film.remove({ _id: id })
        .exec()
        .then(result => {
            res.status(200).json({
                message: 'Film Deleted',
                request: {
                    type: 'POST',
                    url: 'http://localhost:3000/films',
                    body: {
                        name: 'String',
                        rating: 'Number',
                        description: 'String',
                        publishDate: 'Date',
                        cast: 'String',
                        coverImageName: 'String',
                        director: 'directorId',
                        category: 'categoryId',
                        releaseDate: 'Datetime',
                        linkTrailer: 'String'
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
module.exports = router;