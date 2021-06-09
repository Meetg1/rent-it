var mongoose = require('mongoose');

var ReviewSchema = new mongoose.Schema({
    rating: {       
        type: Number,        
        required: "Please provide a rating (1-5 stars).",
        min: 1,
        max: 5,
		  default : 0
    },
    text: {
        type: String
    },
    // author id and username fields
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    	//to store associated item's id
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "item"
    }
},
{
    timestamps: true  // enables mongoose to assign createdAt and updatedAt fields to your schema, the type assigned is Date.
});

module.exports = mongoose.model('Review',ReviewSchema);
