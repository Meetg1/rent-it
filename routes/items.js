var express 	= require('express'),
	 router  	= express.Router(),
	 Item = require('../models/item.js'),
    Review     = require('../models/review.js'),
	 middleware = require('../middleware')

const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken })
	 
// show all items
router.get("/items",function(req, res){
	
	if(req.query.search){
		const regex = new RegExp(req.query.search, 'gi');
		
		Item.find({ $or: [{name: regex,}, {location: regex}, {"author.username":regex}] }, function(err, searcheditems){
			if(err) {
				console.log(err);
				res.redirect('/items');
			}
			else {
				if(searcheditems.length === 0) {
					req.flash('error', 'Nothing found. Please try again.')
					return res.redirect('back');
				}
				res.render("item/index.ejs", {items : searcheditems, page : "home"});
			}
		})
	}  else{
			Item.find({},function(err, allitems){  //fetch all items from DB
				if(err){
					console.log(err);
				}
				else{
					res.render("item/index.ejs",{items : allitems, page : "home"});  //pass all items to the ejs
				}
			})
	   }	
});

//get form for putting new item if loggedIn
router.get("/items/new", middleware.isLoggedIn ,function(req, res){
	res.render("item/newitem.ejs");
});

//show more info about the clicked item
router.get("/items/:slug",function(req, res){
	//find the item with provided slug
	Item.findOne({slug : req.params.slug})
		.populate({
			path: 'reviews',
				options: {
					sort : {createdAt : -1}
				} 
		})
		.exec(function(err, requesteditem){
		
		if(err){
		   console.log(err);
		}
		else{
			console.log(requesteditem)	
		   res.render("item/show.ejs", {item : requesteditem});
		}
	})
})

//handle newitem form data
router.post("/items", middleware.isLoggedIn, async function(req, res){
  // get data from form and add to item object
  var name 	      = req.body.name;
  var image       = req.body.imageurl;
  var description = req.body.description;
  var price       = req.body.price;
  var mobile      = req.body.mobile;
  var location    = req.body.location;
  var email       = req.body.email;
  var author = {
      id: req.user._id,
      username: req.user.username
  }
 
  var newitem = {name: name, image: image, description: description, price : price, author : author, email : email, location : location, mobile : mobile };

	const geoData = await geocoder.forwardGeocode({
		query: req.body.location,
		limit: 1
	}).send()

	newitem.geometry = geoData.body.features[0].geometry;
	
	
	
    // Create a new item and save to DB
    Item.create(newitem, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
			  console.log(newlyCreated);
            //redirect back to items page
            res.redirect("/items");
      	 }
    })
  })


//get edit form
router.get('/items/:slug/edit', middleware.checkitemOwnership, function(req, res){
	
	Item.findOne({ slug : req.params.slug }, function(err, founditem){
		if(err){console.log(err)}
		else{	
		  res.render('item/edit.ejs', {item : founditem});	
		}
	})
})

//updating item using put request
router.put('/items/:slug', middleware.checkitemOwnership, function(req, res){
	delete req.body.item.rating //As a security measure, we add delete req.body.item.rating; in the item update (PUT) route to protect the item.rating field from manipulation, since we are passing the req.body.item object to the Item.findByIdAndUpdate() method.
	Item.findOne({ slug : req.params.slug }, function(err, founditem){
		if(err || !founditem){
			console.log(err);
			req.flash('err', 'item not found!')
			res.redirect('/items')
		}
		else{
			founditem.name        = req.body.item.name;
			founditem.image       = req.body.item.image;
			founditem.description = req.body.item.description;
			founditem.price       = req.body.item.price;
			if(req.body.item.isRent && req.body.item.isRent=='on'){
				founditem.isRented = false;
			}else founditem.isRented = true;
			founditem.save(function(err){
				if(err) {
					console.log(err);
					res.redirect('/items')
				}
				else {
					res.redirect('/items/'+founditem.slug)
				}
			})
		}
	})
})

//deleting item using delete request
router.delete('/items/:slug', middleware.checkitemOwnership, function(req, res){
	
	Item.findOneAndRemove({ slug : req.params.slug },function(err, deleteditem){
		if(err){console.log(err)}
		
        		Review.deleteMany( {_id: { $in: deleteditem.reviews } }, (err) => {  //remove all reviews, whose ids are found in the item, from the database.
					if (err) {console.log(err)}
					else {
						req.flash('success','item Deleted Successfully.')
						res.redirect("/items");	
					}
				})
	})
})


module.exports = router;