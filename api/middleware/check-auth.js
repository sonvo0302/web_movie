const jwt =require('jsonwebtoken');


module.exports =(req,res,next)=>{
    try{
        const token =req.headers.authorization.split(" ")[1];
        if(!token) return res.status(500).json({
            message:'Need to login first'
        })
        const decode =jwt.verify(token,process.env.JWT_KEY);
        req.userData=decode;
        req.token =token;
        next();
    }catch(error){
        return res.status(500).json({
            message:'Need to login first'
        })
    }
};

// const jwt = require('jsonwebtoken')
// const User = require('../models/user')

// const auth = async(req, res, next) => {
//     try{
//         const token =req.headers.authorization.split(" ")[1];
//         if(!token) return res.status(500).json({
//             message:'Need to login first'
//         })
//         const decode =jwt.verify(token,process.env.JWT_KEY);
//         const user = await User.findOne({ _id: data._id, 'tokens.token': token })
//         if (!user) {
//             throw new Error()
//         }
//         User.findByToken(token,(err,user)=>{
//             if(err) throw err;
//             if(!user) return res.json({
//                 error :true
//             });

//         req.user = user
//         req.token = token
//         next();
//         })
//     }catch(error){
//         return res.status(500).json({
//             message:'Need to login first'
//         })
//     }
    

// }
// module.exports = auth

