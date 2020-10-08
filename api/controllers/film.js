const Film= require('../models/film')
const Rating =require('../models/rating');

exports.films_get_all = async(req,res,next)=>{
    const film = await Film.find({})
    

    Film.find().sort({publishDate:'desc'})
    .select('name publishDate description cast coverImageName'+
    'director category linkTrailer create_at _id')
    .exec()
    .then(docs=>{
        
        const respond = {
            count:docs.length,
            films:docs.map(doc=>{
                return{
                    name:doc.name,
                    rating:rating,
                    publishDate:doc.publishDate,
                    description:doc.description,
                    create_at:doc.create_at,
                    cast:doc.cast,
                    coverImageName:doc.coverImageName,
                    director:doc.director,
                    category:doc.category,
                    linkTrailer:doc.linkTrailer,
                    _id:doc._id,
                    request:{
                        type:'GET',
                        url:'http://localhost:3000/films/'+doc._id
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
        });
    });
}