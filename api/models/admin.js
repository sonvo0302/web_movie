const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const adminSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        minLength: 8
    },
    tokens: [{
        token: {
            type: String,
            required: true
        },
  }]
})

adminSchema.pre('save', async function (next) {
    // Hash the password before saving the user model
    const admin = this
    if (admin.isModified('password')) {
        admin.password = await bcrypt.hash(admin.password, 8)
    }
    next()
})

adminSchema.methods.generateAuthToken = async function() {
    // Generate an auth token for the user
    const admin = this
    const token = jwt.sign({_id: admin._id}, process.env.JWT_KEY)
    //user.tokens = user.tokens.concat({token})
    //await user.save()
    return token
}

adminSchema.statics.findByCredentials = async (username, password) => {
    // Search for a user by email and password.
    const admin = await User.findOne({username} )
    if (!admin) {
        throw new Error({ error: 'Invalid login credentials' })
    }
    const isPasswordMatch = await bcrypt.compare(password, admin.password)
    if (!isPasswordMatch) {
        throw new Error({ error: 'Invalid login credentials' })
    }
    
    return admin
}




const Admin = mongoose.model('Admin', adminSchema)

module.exports = Admin