const express = require('express');
const router =express.Router();
const mongoose =require('mongoose');
const Film_Category =require('../models/film_category');
const { map } = require('../../app');
const Film =require('../models/film');
const Category=require('../models/category');

router.get('/',(req,res,next)=>{
    Film_Category.find()
    .select('film category _id')
    .populate('film category')
    .exec()
    .then(docs=>{
        res.status(200).json({
            count:docs.length,
            film_categories:docs.map(doc=>{
                return{
                    _id:doc._id,
                    film:doc.film,
                    category:doc.category,
                    request:{
                        type:'GET',
                        url:'http://localhost:3000/film_category'+doc._id
                    }
                }
            })
            
        })
    })
    .catch(err=>{
        res.status(500).json({
            error:err
        })
    })
})

router.post('/',(req,res,next)=>{
 
    Category.findById(req.body.categoryId)
    .then(category=>{
        if(!category){
            return res.status(404).json({
                message:'Category not found'
            })
        }
        Film.findById(req.body.filmId)
        .then(film=>{
            if(!film){
                return res.status(404).json({
                    message:'Film not found'
                })
            }
            const film_category=new Film_Category({
                _id: mongoose.Types.ObjectId(),
                film:req.body.filmId,
                category:req.body.categoryId
            })
            return film_category
            .save()
            .then(result=>{
                console.log(result);
                res.status(200).json({
                    message:"Created film category successfully",
                    createdFilmCategory:{
                        film:result.film,
                        category:result.category,
                        _id:result._id,
                        request:{
                            type:'GET',
                            url:'http://localhost:3000/film_category/'+result._id
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
        .catch(err=>{
            res.status(500).json({
                message:'Film not found',
                error:err
            })
        })

    })
    .catch(err=>{
        res.status(500).json({
            message:'Category not found',
            error:err
        })
    })
    
})

router.get('/:filmcategoryId',(req,res,next)=>{
   const id =req.body.filmcategoryId;
    Film_Category.findById(id)
    .select('film category _id')
    .populate('category')
    .exec()
    .then(film_category=>{
        res.status(200).json({
            film_category:film_category,
            request:{
                type:'GET',
                url:'http://localhost:3000/film_category'
            }
        })
    })
    .catch(err=>{
        res.status(500).json({
            error:err
        })
    })
})

module.exports = router;