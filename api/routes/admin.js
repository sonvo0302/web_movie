const express = require('express')
const Admin = require('../models/admin')
const router = express.Router()
const mongoose = require('mongoose')



router.post('/register', async (req, res) => {
    try {
        const { name, username, password, password2 } = req.body;

        if (!name || !username || !password || !password2) {
            return res.status(400).json({ msg: 'Please enter all fields' });
        }

        if (password != password2) {
            return res.status(400).json({ msg: 'Passwords do not match' });
        }

        if (password.length < 8) {
            return res.status(400).json({ msg: 'Password must be at least 6 characters' });
        }


        const admins = await Admin.findOne({ username: username })

        if (admins) {
            return res.status(401).json({ message: 'Register failed! Username exists ' })
        }
        const admin = new Admin(req.body)
        await admin.save()
        const token = await admin.generateAuthToken()
        res.status(200).json({
            message: 'Register Successful',
            admin: admin,
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
    const { username, password } = req.body
    const admins = await Admin.findOne({ username: username })

    if (!admins) {
        return res.status(401).json({ error: 'Login failed! Username does not exist ' })
    }
    try {
        const admin = await Admin.findByCredentials(username, password)
        if(!admin){
            res.status(401).json({message:'Check Credentials Failed'})
        }

        //user.resetToken = null
        const token = await admin.generateAuthToken()
        res.status(200).json({
            message: 'Login Successful',
            token: token,
            admin: admin,

        })
    
    } catch (err) {
        res.status(500).json({
            message: 'Login failed! Password Invalid',
            error: err
        })
    }


})


module.exports = router