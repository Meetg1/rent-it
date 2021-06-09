var mongoose = require('mongoose');

var ItemSchema = new mongoose.Schema({
	name : String,
	slug : {
		type : String,
		unique : true
	},
	isRented : {
		type : Boolean,
		default : false
	},
	image : String,
	description : String,
	price : String,
	location: String,
	mobile: String,
	email: String,
	geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
	author : {                                             //author(user)
					id : {
						type: mongoose.Schema.Types.ObjectId,
						ref : 'user'
					},
					username : String
	},
	 reviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Review"
        }
    ],
    rating: {
        type: Number,
        default: 0
    }
},
{
	timestamps : true
});

//https://github.com/zarkomaslaric/yelpcamp-slugs/

// add a slug before the item gets saved to the database
ItemSchema.pre("save", async function(next){
	try{
		if(this.isNew || this.isModified("name")) {
			this.slug = await generateUniqueSlug(this._id, this.name)
		}
		next();
	}
	catch(err){
		console.log(err)
	}	
})


var Item = mongoose.model('Item',ItemSchema);
module.exports = Item;

// 1. generate the initial slug
// 2. check if a item with the slug already exists
// 3. check if a item was found or,,; if the found item is the current item(doing this check cuz when updating a item this will cause problem)
// 4. if unique, return slug 
// 5. if not unique, generate a new slug
// 6. check again by calling the function recursively





async function generateUniqueSlug(itemId, itemName, slug) {        //here itemId, itemName are parameters	
	try{
		if(!slug) {                                 // 1.
			slug = slugify(itemName);
		}
		var item = await Item.findOne( {slug : slug} )   // 2.
			if(!item || item._id.equals(itemId)) {        // 3.
				return slug;                                           // 4.
			}
			var newSlug = slugify(itemName);                             // 5.
			return await generateUniqueSlug(itemId, itemName, newSlug)   // 6. //here itemId, itemName are being passed as arguments	
	} catch(err){
		console.log(err)
	}
	
}
function slugify(text){
	var slug = text.toString().toLowerCase()
	.replace(/\s+/g, '-')        // Replace spaces with -
   .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
   .replace(/\-\-+/g, '-')      // Replace multiple - with single -
   .replace(/^-+/, '')          // Trim - from start of text
   .replace(/-+$/, '')          // Trim - from end of text
   .substring(0, 75);           // Trim at 75 characters
	
	return slug + "-" + Math.floor(1000 + Math.random() * 9000)
}
