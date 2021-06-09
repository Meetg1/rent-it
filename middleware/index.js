const Item = require('../models/item.js')
const Review    = require('../models/review.js')

const middlewareObj = {};

//check login middleware
middlewareObj.isLoggedIn = function(req, res, next){
	if(req.isAuthenticated()){
		return next()
	}
	req.flash('error','Please Login First.')
	res.redirect('/login')
}

//     ---------user authorization middleware-----------------

//is user logged in -1
//does user own the item -2
middlewareObj.checkitemOwnership = function(req, res, next){
	if(req.isAuthenticated())  //-1
		{
			Item.findOne({ slug : req.params.slug }, function(err, foundItem){
				if(err || !foundItem) {
					console.log(err)
					req.flash('error', 'item doesnt exist!')
					return res.redirect('back');
				}
				else {
					if(foundItem.author.id.equals(req.user._id) || req.user.isAdmin){  //-2
						next();
					}
					else{
						req.flash('error','You dont have permission to do that!');
						res.redirect("/items");
					}
				}
			})
		}
	else {
		req.flash('error','You need to be Logged in to do that!');
		res.redirect('/login');
		  }
}



//           --------------Review authorization middleware-------------------

//is user logged in -1
//does user own the Review -2	
middlewareObj.checkReviewOwnership = function(req, res, next){
	if(req.isAuthenticated())  //-1
		{
			Review.findById(req.params.review_id,function(err, foundReview){
				if(err){console.log(err)}
				else {
					if(foundReview.author.id.equals(req.user._id) || req.user.isAdmin){  //-2
						next();
					}
					else{
						res.redirect("/items");
					}
				}
			})
		}
	else res.redirect('/login');
}

//          -------check Review existence middleware------------ 


middlewareObj.checkReviewExistence = function(req, res, next){
	if(req.isAuthenticated){
		Item.findOne({ slug : req.params.slug }).populate('reviews').exec(function(err, foundItem){	
			if(err || !foundItem){
				console.log(err)
				res.redirect('/items')
			}
			else{
				var foundReview = foundItem.reviews.some(function(Review){         // some() array method which will return true if any element of the array matches the condition that we implement in its callback function 
				                     return Review.author.id.equals(req.user._id)  // the condition is "did we find the logged in user's id in the Reviews"
				                  })
			}
			if(foundReview === true){ //foundReview will be true if the some() method above returned true
				req.flash('error', 'You have already added a Review.')
				res.redirect('/items/'+req.params.slug)
			}
			else{
				next() //if the Review was not found, go to the next middleware
			}
		})
	} 
	else{
		req.flash('error', 'Please login first')
		res.redirect('login')
	}
}

module.exports = middlewareObj;