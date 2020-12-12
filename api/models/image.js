const mongoose = require('mongoose');
const path = require('path');

const coverImageBasePath = 'uploads/filmCovers';

const imageSchema = mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
	name: { type: String, require: true },
	imageData: { type: String, require: true }
});

// imageSchema.methods.saveImage = async function(category) {
// 	// Generate an auth token for the user
// 	const film = this;
// 	film.categories = film.categories.concat({ category });
// 	await film.save();
// 	return category;
// };

module.exports = mongoose.model('Image', imageSchema);
module.exports.coverImageBasePath = coverImageBasePath;
