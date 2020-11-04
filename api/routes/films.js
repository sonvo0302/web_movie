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
const { resolveSoa } = require('dns');
const category = require('../models/category');
const director = require('../models/director');




const uploadPath = path.join('public', Film.coverImageBasePath)


const imageMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'images/gif']
const upload = multer({
    // dest: uploadPath,
    // fileFilter: (req, file, callback) => {
    //     callback(null, imageMimeTypes.includes(file.mimetype))
    // }

})



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
//router.get('/filmMostWatched', (req, res) => res.render('films/filmMostWatched'));
//router.get('/latestFilm', (req, res) => res.render('films/latestFilm'));
router.get('/lastest', auth, async (req, res, next) => {
    const regex = new RegExp(req.query.text_search, 'i');

    Film.find({ name: regex })
        .select('name publishDate description cast coverImageName director categories linkTrailer create_at _id viewFilm').sort({ publishDate: 'desc' }).limit(10).skip(2)
        .exec()
        .then(docs => {
            const respond = {
                count: docs.length,
                films: docs.map(doc => {
                    return {
                        _id: doc._id,
                        viewFilm: doc.viewFilm,
                        name: doc.name,
                        publishDate: doc.publishDate,
                        description: doc.description,
                        create_at: doc.create_at,
                        cast: doc.cast,
                        coverImageName: doc.coverImageName,
                        director: doc.director,
                        categories: doc.categories,
                        linkTrailer: doc.linkTrailer,
                        request: {
                            type: 'GET',
                            url: 'http://localhost:4000/film/' + doc._id
                        }
                    }
                }),

            }

            res.status(200).json(respond)

        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
});



router.get('/most_watched', auth, async (req, res, next) => {
    const regex = new RegExp(req.query.text_search, 'i');
    Film.find({ name: regex })
        .select('name publishDate description cast coverImageName director categories linkTrailer create_at _id viewFilm').sort({ viewFilm: 'desc' }).limit(10).skip(2)
        .exec()
        .then(docs => {
            const respond = {
                count: docs.length,
                films: docs.map(doc => {
                    return {
                        id: doc._id,
                        name: doc.name,
                        viewFilm: doc.viewFilm,
                        publishDate: doc.publishDate,
                        description: doc.description,
                        create_at: doc.create_at,
                        cast: doc.cast,
                        coverImageName: doc.coverImageName,
                        director: doc.director,
                        categories: doc.categories,
                        linkTrailer: doc.linkTrailer,
                        request: {
                            type: 'GET',
                            url: 'http://localhost:4000/film/' + doc._id
                        }
                    }
                }),

            }

            res.status(200).json(respond)

        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });

});
router.get('/', auth, async (req, res, next) => {
    const regex = new RegExp(req.query.text_search, 'i');
    Film.find({ name: regex })
        .select('name publishDate description cast coverImageName director category linkTrailer create_at _id viewFilm').limit(10)
        .exec()
        .then(docs => {
            const respond = {
                count: docs.length,
                films: docs.map(doc => {
                    return {
                        name: doc.name,
                        viewFilm: doc.viewFilm,
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
                            url: 'http://localhost:4000/film/' + doc._id
                        }
                    }
                }),

            }

            res.status(200).json(respond)

        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });

});



router.post('/new', auth, upload.single('coverImageName'), async (req, res, next) => {


    // const fileName = req.file != null ? req.file.filename : null
    const film_search = await Film.findOne({name:req.body.name});
    const film_search_category =await Film.findOne({"categories": { $elemMatch: { category: req.body.categoryId}}})
    if(film_search){
        let film;
        film = await Film.findOne(film_search._id)
        const categoryId = req.body.categoryId
        const category =await film.Save_Category(categoryId)
        //film.save()  
        res.status(200).json({
            message: 'Login Successful',
            category: category,
            film: film,

        })    
    }else{
        try {
            const film = new Film({
                _id: new mongoose.Types.ObjectId(),
                name: req.body.name,
                coverImageName: req.file.buffer.toString('base64'),
                //imgType:req.body.coverImageName.type,
                //rating :req.body.rating,
                publishDate: req.body.publishDate,
                description: req.body.description,
                linkTrailer: req.body.linkTrailer,
                cast: req.body.cast,
                director: req.body.directorId
            })
    
            await film.save()
            const categoryId = req.body.categoryId
            const category = film.Save_Category(categoryId)
            res.status(200).json({
                message:'Success',
                film: film,
                category: category
            })
        } catch (err) {
            res.status(500).json({
                error: err,
                message: 'Add film fail'
            })
        }
    }
})






router.get('/:filmId',auth, async (req, res, next) => {

    const id = req.params.filmId;
    const film = await Film.findById(id)
    const rating = await Rating.find({ film: film.id }).exec();
    const comment = await Comment.find({ film: film.id }).exec();
    const loginId = req.user._id;
    console.log(loginId)
    const film_user_histories = await Film_User_History.find({ film: film.id, user: loginId }).exec();

    if (film_user_histories.length == '') {

        const film_user_history = new Film_User_History({
            _id: new mongoose.Types.ObjectId(),
            user: loginId,
            film: req.params.filmId

        })

        await film_user_history.save();
        const film_user_history1 = await Film_User_History.find({ film: film.id }).exec();

        Film.findById(id, (errorFind, film) => {
            if (errorFind) throw errorFind;

            const condition = ({ _id: id })
            const dataForUpdate = { viewFilm: film_user_history1.length }
            Film.findOneAndUpdate(condition, dataForUpdate, { new: true }).populate('categories director').exec()
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
                            ratings: rating,
                            ratingAverage: avg,
                            film: result,
                            request: {
                                type: 'GET',
                                url: 'http://localhost:4000/film/' + result._id
                            }
                        });
                    } else {
                        res.status(404).json({ message: 'There was a problem updating password' });
                    }
                })



            if (errorFind) {
                return res.status(401).json({
                    msg: "Something Went Wrong",
                    success: false
                });
            }
        })
    } else {
        const film_user_history1 = await Film_User_History.find({ film: film.id }).exec();
        Film.findById(id, (errorFind, film) => {
            if (errorFind) throw errorFind;

            const condition = ({ _id: id })
            const dataForUpdate = { viewFilm: film_user_history1.length }
            Film.findOneAndUpdate(condition, dataForUpdate, { new: true }).populate('categories director').exec()
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
                            ratings: rating,
                            ratingAverage: avg,
                            film: result,
                            request: {
                                type: 'GET',
                                url: 'http://localhost:4000/film/' + result._id
                            }
                        });
                    } else {
                        res.status(404).json({ message: 'There was a problem updating password' });
                    }
                })



            if (errorFind) {
                return res.status(401).json({
                    msg: "Something Went Wrong",
                    success: false
                });
            }
        })
    }


})

router.put('/edit/:filmId', auth, upload.single('coverImageName'), async (req, res, next) => {
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

        film.name = req.body.name,
        film.coverImageName = req.file.buffer.toString('base64'),
        film.publishDate = req.body.publishDate,
        film.description = req.body.description,
        film.linkTrailer = req.body.linkTrailer,
        film.cast = req.body.cast,
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
                    message: "Update film successfully",
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
                            url: 'http://localhost:3000/film/' + result._id
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
        const categoryId = req.body.categoryId
        const category = film.Save_Category(categoryId)




});

router.delete('/delete/:filmId', (req, res, next) => {
    const id = req.params.filmId;
    Film.remove({ _id: id })
        .exec()
        .then(result => {
            res.status(200).json({
                message: 'Film Deleted',
                request: {
                    type: 'POST',
                    url: 'http://localhost:4000/film/',
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