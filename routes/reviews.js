var express = require('express'),
    router  = express.Router(),
	 Item = require('../models/item.js'),
	 Review = require('../models/review.js'),
	 middleware = require('../middleware')
	 
	 
//add review if user is logged in and doesnt have a review already.
router.post('/items/:slug/reviews', middleware.isLoggedIn, middleware.checkReviewExistence, function(req, res){
	//lookup item using ID -1
	//create new review -2
	//add username, userID and the associated item to the review model -2.5 (coz these things are not gonna be coming when user submits a review)
	//add review to the item model -3
	//add review to the user model -4
	//recalculate the average rating of the item including the current rating added -5
	//redirect to previous page -6

	//lookup item using ID
    Item.findOne({ slug : req.params.slug }).populate('reviews').exec(function(err, item){ // -1		
		
		Review.create(req.body.review,function(err, newreview){ // -2
			if(err){
				console.log(err);
			}
			else{
				var user = req.user;
				newreview.author.id = req.user._id; 	      // -2.5
				newreview.author.username = req.user.username;
				newreview.item = item;
				newreview.save();
				item.reviews.push(newreview);  // -3
				user.reviews.push(newreview); // -4
				user.save();
				item.rating = calculateAvgRating(item.reviews);  // -5
				item.save();
				req.flash('success','Review Added Successfully.')
				res.redirect('/items/'+item.slug);  // -6
			}
		}); 
	});
})
	
	
//update review using put req (not allowing editing of review as of now)
// router.put('/items/:id/reviews/:review_id', middleware.checkReviewOwnership, function(req ,res){
// 	Review.findByIdAndUpdate(req.params.review_id, req.body.review, function(err, updatedReview){
// 		if(err){console.log(err)}
// 		else{
// 			console.log(updatedReview)
// 			req.flash('success','review edited successfully.')
// 			res.redirect('/items/' + req.params.id)
// 		}
// 	})	
// })

//delete review
// 1. find and remove the review to be deleted
// 2. remove the review from the item model in DB(doesnt get removed from the item model by itself we have to do this manually)
// above step is done using $pull method. {new: true} is there becoz we want the updateditem to be passed down and not the old one becoz the old one still has the review
// we populate(reviews) so that we can pass all the actual(actual as in whole review and not just its id) reviews of the item to our calcAvg function 

router.delete('/items/:slug/reviews/:review_id', middleware.checkReviewOwnership, function(req, res){
	Review.findByIdAndRemove(req.params.review_id, function(err ,deletedreview){
		if(err){console.log(err)}
		else{
			Item.findOneAndUpdate({ slug : req.params.slug }, {$pull: { reviews : req.params.review_id }}, {new : true}).populate('reviews').exec(function(err, updateditem){
				if(err){
					console.log(err)
					return res.redirect('back')
				}
				updateditem.rating = calculateAvgRating(updateditem.reviews);
				updateditem.save();
				req.flash('success','review Deleted Successfully.')
				res.redirect('/items/'+ req.params.slug)
			})
		}
	})
})



function calculateAvgRating(reviews) {
	if(reviews.length === 0){        //always have an if to handle 0 data...
		return 0;
	}
	var sum = 0;
	reviews.forEach(function(review){
		sum += review.rating;
	})
	var average = sum / reviews.length;
	return average;
} 


module.exports = router;