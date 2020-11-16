const express = require('express')
const User = require('../models/user')
const auth = require('../middleware/auth')
const router = express.Router()
const User_Info = require('../models/user_info')
const Film_User_History = require('../models/film_user_history')
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs')
const Rating = require('../models/rating')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')




// router.post('/send', function(req, res, next) {
//     var transporter =  nodemailer.createTransport({ // config mail server
//         service: 'Gmail',
//         auth: {
//             user: 'sonngao2512@gmail.com',
//             pass: 'iuemnhiu2512'
//         }
//     });
//     var mainOptions = { // thiết lập đối tượng, nội dung gửi mail
//         from: 'Thanh Batmon',
//         to: 'tomail@gmail.com',
//         subject: 'Test Nodemailer',
//         text: 'You recieved message from ' + req.body.email,
//         html: '<p>You have got a new message</b><ul><li>Username:' + req.body.name + '</li><li>Email:' + req.body.email + '</li><li>Username:' + req.body.message + '</li></ul>'
//     }
//     transporter.sendMail(mainOptions, function(err, info){
//         if (err) {
//             console.log(err);
//             res.redirect('/');
//         } else {
//             console.log('Message sent: ' +  info.response);
//             res.redirect('/');
//         }
//     });
// });


router.get('/all', auth, async (req, res, next) => {
    await User.find()
        .select('username email password _id')
        .exec()
        .then(docs => {
            const respond = {
                count: docs.length,
                users: docs.map(doc => {
                    return {
                        email: doc.email,
                        password: doc.password,
                        username: doc.username,
                        _id: doc._id,
                        request: {
                            type: 'GET',
                            url: 'http://localhost:3000/user/' + doc._id
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


router.post('/password/reset', async (req, res) => {
    if (req.body.email == '') {
        res.status(400).json({
            message: 'Please enter in field'
        })
    } else {
        User.findOne({ email: req.body.email }, function (error, userData) {
            if (!userData) {
                res.status(400).json({
                    mg: 'Email not exists'
                })
            } else {
                const resetToken = jwt.sign({ _id: userData._id }, process.env.RESET_KEY)
                userData.resetToken = resetToken
                userData.save()


                var transporter = nodemailer.createTransport({
                    host: 'smtp.gmail.com',
                    port: 465,
                    secure: true,
                    service: 'Gmail',
                    auth: {
                        user: 'sonvo0302@gmail.com', //Tài khoản gmail vừa tạo
                        pass: 'frygfmcbfjthezyd' //Mật khẩu tài khoản gmail vừa tạo
                    },
                    tls: {
                        // do not fail on invalid certs
                        rejectUnauthorized: false
                    }
                    // host: "smtp.mailtrap.io",
                    // port: 2525,
                    // auth: {
                    //     user: "b17319188d5ff4",
                    //     pass: "fe7f169ce62c87"
                    // }

                });


                // const condition = ({_id:userData._id })
                // const dataForUpdate = { resetToken: resetToken}
                // User.findOneAndUpdate(condition,dataForUpdate,{ new: true }).exec();
                //var currentDateTime = new Date();
                var mailOptions = {
                    from: 'sonvo0302@gmail.com',
                    to: req.body.email,
                    subject: 'Password Reset',
                    // text: 'That was easy!',
                    html: "<h1>Welcome To Daily Task Report ! </h1><p>\
            <h3>Hello "+ userData.name + "</h3>\
            If You are requested to reset your password then click on below link<br/>\
            <a href='http://localhost:4000/user/password/change"+ '?email=' + userData.email + '&resetToken=' + userData.resetToken + "'>Click On This Link</a>\
            </p>"
                };
                //console.log(resetToken)


                transporter.sendMail(mailOptions, async function (error, info) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                        await User.updateOne({ email: userData.email }, {
                            resetToken: userData.resetToken,

                        }, { multi: true }, function (err, affected, resp) {
                            return res.status(200).json({
                                success: false,
                                msg: info.response,
                                userlist: resp
                            });
                        })
                    }
                });
            }
        })


    }
});

router.post('/password/change', (req, res) => {
    const email_reset = req.query.email
    const token_reset = req.query.resetToken
    console.log(token_reset)
    // const token_reset = jwt.verify(reset,process.env.RESET_KEY)

    User.findOne({ email: email_reset, resetToken: token_reset }, (errorFind, user) => {
        bcrypt.compare(req.body.password, user.password).then(isMatch => {
            if (isMatch) {
                res.status(401).json({ message: 'new password like your old password' })
            } else
                if (req.body.password.length < 8) {
                    res.status(401).json({ message: 'Password must be 8 characters or more' })
                } else
                    if (req.body.password == req.body.password2) {
                        bcrypt.hash(req.body.password, 8, (err, hash) => {
                            if (err) throw err;
                            const newPassword = hash;
                            const condition = ({ _id: user._id })
                            const dataForUpdate = { password: newPassword, resetToken: token_reset, updatedDate: Date.now().toString() }
                            User.findOneAndUpdate(condition, dataForUpdate, { new: true }).exec()
                                .then(result => {
                                    if (result) {
                                        res.status(200).json({
                                            user: result,
                                            request: {
                                                type: 'GET',
                                                url: 'http://localhost:4000/user/' + result._id
                                            }
                                        });
                                    } else {
                                        res.status(404).json({ message: 'There was a problem updating password' });
                                    }
                                })

                        })

                    } else {
                        res.status(401).json({ message: 'password does not match' })
                    }

        })

        if (errorFind) {
            return res.status(401).json({
                msg: "Something Went Wrong",
                success: false
            });
        }
    })
})

var emailRegex = /^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;

function isEmailValid(email) {
    if (!email)
        return false;

    if (email.length > 254)
        return false;

    var valid = emailRegex.test(email);
    if (!valid)
        return false;

    // Further checking of some things regex can't handle
    var parts = email.split("@");
    if (parts[0].length > 64)
        return false;

    var domainParts = parts[1].split(".");
    if (domainParts.some(function (part) { return part.length > 63; }))
        return false;

    return true;
}

router.put('/update/:id', auth, async (req, res) => {
    const id = req.params.id;
    User.findById(id, async function (err, user) {
        bcrypt.compare(req.body.currentPassword, user.password, (err, isMatch) => {
            if (isMatch) {
                bcrypt.hash(req.body.new_password, 8, (error, hash) => {
                    if (error) throw error;
                    if (isEmailValid(req.body.email) == true) {
                        const hasedPassword = hash;
                        const condition = { _id: id };
                        const dataForUpdate = { name: req.body.name, email: req.body.email, password: hasedPassword, updatedDate: Date.now().toString() };
                        User.findOneAndUpdate(condition, dataForUpdate, { new: true }).exec()
                            .then(result => {
                                if (result) {
                                    res.status(200).json({
                                        user: result,
                                        request: {
                                            type: 'GET',
                                            url: 'http://localhost:4000/user/' + result._id
                                        }
                                    });
                                } else {
                                    res.status(404).json({ message: 'There was a problem updating user' });
                                }
                            })
                    } else {
                        res.status(401).json({
                            message: 'Email must be xxx@gmail.com'
                        })
                    }
                })



            } else {
                if (isEmailValid(req.body.email) == true) {
                    let condition = { _id: id };
                    let dataForUpdate = { name: req.body.name, email: req.body.email, updatedDate: Date.now().toString() };
                    User.findOneAndUpdate(condition, dataForUpdate, { new: true }).exec()
                        .then(result => {
                            if (result) {
                                res.status(200).json({
                                    message: 'Current Password Incorrect, No update password',
                                    user: result,
                                    request: {
                                        type: 'GET',
                                        url: 'http://localhost:4000/user/' + result._id
                                    }
                                });
                            } else {
                                res.status(404).json({ message: 'There was a problem updating user' });
                            }
                        })
                } else {
                    res.status(401).json({
                        message: 'Email must be xxx@gmail.com'
                    })
                }

            }
        })



        // } else {
        //     return res.status(401).json({
        //         msg: "Incorrect password.",
        //         success: false
        //     });
        // }
        let user_info;
        user_info = await User_Info.findOne({ user: user._id }).exec();
        user_info.name = req.body.name;
        user_info.save()
    })


});



router.post('/register', async (req, res) => {
    // Create a new user

    try {
        const { name, email, password, password2 } = req.body;

        if (!name || !email || !password || !password2) {
            return res.status(400).json({ msg: 'Please enter all fields' });
        }
        if (isEmailValid(email) == false) {
            res.status(401).json({
                msg: 'Email must be xxx@gmail.com'
            })
        }
        if (password.length < 8) {
            return res.status(400).json({ msg: 'Password must be at least 6 characters' });
        }
        if (password != password2) {
            return res.status(400).json({ msg: 'Passwords do not match' });
        }



        const users = await User.findOne({ email: email })

        if (users) {
            return res.status(401).json({ message: 'Register failed! Email exists ' })
        }
        const user = new User(req.body)
        await user.save()
        const user_info = new User_Info({
            _id: new mongoose.Types.ObjectId(),
            name: req.body.name,
            dateofbirth: null,
            mobile_phone: null,
            gender: null,
            user: user._id
        })
        await user_info.save()
        const token = await user.generateAuthToken()
        res.status(200).json({
            message: 'Register Successful',
            user: user,
            token: token
        })
    } catch (err) {
        res.status(400).json({
            message: 'Register failed!',
            error: err
        })

    }



})



router.post('/login', async (req, res) => {
    //Login a registered user
    const { email, password } = req.body
    const users = await User.findOne({ email: email })
    if (!email || !password) {
        return res.status(401).json({ message: 'Please enter all fields' })
    }
    if (!users) {
        return res.status(401).json({ error: 'Login failed! Email does not exist ' })
    }
    try {
        const user = await User.findByCredentials(email, password)
        if (!user) {
            res.status(401).json({ message: 'Check Credentials Failed' })
        }

        //user.resetToken = null
        const token = await user.generateAuthToken()
        res.status(200).json({
            message: 'Login Successful',
            token: token,
            user: user,

        })

    } catch (err) {
        res.status(500).json({
            message: 'Login failed! Password Invalid',
            error: err
        })
    }


})

router.get('/me', auth, async (req, res) => {
    // View logged in user profile
    try {
        res.send(req.user)
    } catch (err) {
        res.status(500).json({ error: err });
    }

})
router.get('/info/:userId', auth, async (req, res, next) => {
    const loginId = req.user._id;
    const id = req.params.userId;
    if (loginId == id) {
        s
        const user = await User.findById(id)
        const user_info = await User_Info.find({ user: user.id }).limit(6).exec()
        const user_histories = await Film_User_History.find({ user: user.id }).exec();
        const user_rating = await Rating.find({ user: user.id }).exec();
        await User.findById(id)
            .select('email password _id')
            .exec()
            .then(doc => {
                console.log("From database", doc)
                if (doc) {
                    res.status(200).json({
                        user: doc,
                        user_info: user_info,
                        //film_user_histories: user_histories,
                        //user_rating: user_rating,
                        request: {
                            type: 'GET',
                            url: 'http://localhost:4000/user'
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
    } else {
        res.status(500).json({ message: 'ID does not match' })
    }
})

router.get('/user_history/:userId', auth, async (req, res, next) => {
    const loginId = req.user._id;
    const id = req.params.userId;
    if (loginId == id) {
        const user = await User.findById(id)
        const user_info = await User_Info.find({ user: user.id }).limit(6).exec()
        const user_histories = await Film_User_History.find({ user: user.id }).exec();
        const user_rating = await Rating.find({ user: user.id }).exec();
        await User.findById(id)
            .select('email password _id')
            .exec()
            .then(doc => {
                console.log("From database", doc)
                if (doc) {
                    res.status(200).json({
                        user: doc,
                        //user_info: user_info,
                        film_user_histories: user_histories,
                        //user_rating: user_rating,
                        request: {
                            type: 'GET',
                            url: 'http://localhost:3000/user'
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
    } else {
        res.status(500).json({ message: 'ID does not match' })
    }
})

router.get('/rating_history/:userId', auth, async (req, res, next) => {
    const loginId = req.user._id;
    const id = req.params.userId;
    if (loginId == id) {
        const user = await User.findById(id)
        const user_info = await User_Info.find({ user: user.id }).limit(6).exec()
        const user_histories = await Film_User_History.find({ user: user.id }).exec();
        const user_rating = await Rating.find({ user: user.id }).exec();
        await User.findById(id)
            .select('email password _id')
            .exec()
            .then(doc => {
                console.log("From database", doc)
                if (doc) {
                    res.status(200).json({
                        user: doc,
                        //user_info: user_info,
                        //film_user_histories: user_histories,
                        user_rating: user_rating,
                        request: {
                            type: 'GET',
                            url: 'http://localhost:3000/user'
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
    } else {
        res.status(500).json({ message: 'ID does not match' })
    }
})



// router.post('/logout', auth, async (req, res) => {
//     // Log user out of the application
//     try {
//         req.user.token = req.user.tokens.filter((token) => {
//             return token.token != req.token
//         })
//         await req.user.save()
//         res.status(200).json({ message: 'logout successfull' })
//     } catch (err) {
//         res.status(500).json({ error: err })
//     }
// })

router.post('/logout', auth, async (req, res) => {
    // Log user out of all devices
    try {
        req.user.tokens.splice(0, req.user.tokens.length)
        await req.user.save()
        res.status(200).json({ message: 'logout successfull' })
    } catch (error) {
        res.status(500).json({ error: err })
    }
})

router.delete('/delete/:userId', function (req, res) {
    User.findByIdAndRemove(req.params.userId, function (err, user) {
        if (err) return res.status(500).send("There was a problem deleting the user.");
        res.status(200).send("User: " + user.name + " was deleted.");
    });
});



module.exports = router