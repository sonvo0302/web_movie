const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const multer = require('multer');
const auth = require('../middleware/auth');
const Image = require('../models/image');
const Film = require('../models/film');

const upload = multer();

router.get('/:id', async (req, res, next) => {
	let id = req.params.id;
	await Image.findById(id)
		.then((data) => {
			let img = Buffer.from(data.imageData, 'base64');
			res.writeHead(200, {
				'Content-Type': 'image/png',
				'Content-Length': img.length
			});
			res.end(img);
		})
		.catch((err) => {
			res.status(500).json({ message: err });
		});
});

router.post('/', upload.single('imageData'), async (req, res, next) => {
	// let film = await Film.findById(req.params.filmdId);
	try {
		let image = new Image({
			_id: new mongoose.Types.ObjectId(),
			imageData: req.file.buffer.toString('base64')
		});
		await image.save();
		res.status(200).json({
			message: 'Upload Image successfully!',
			imageUrl: 'http://localhost:4000/image/' + image._id
		});
	} catch (err) {
		res.status(500).json({
			message: err
		});
	}
});

module.exports = router;
