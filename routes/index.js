var express    = require('express'),
	 router     = express.Router(),
	 passport   = require('passport'),
    User       = require('../models/user.js'),
    Item = require('../models/item.js'),
	 crypto     = require('crypto'),
	 async = require('async')



router.get("/",function(req, res){
	res.render("landing.ejs");
});

//====AUTH Routes==========
//show register form
router.get('/register',function(req, res){
	res.render('user/register.ejs', { page : "register"});
});

//handle user's register data
router.post('/register',function(req, res){
	
	var newUser = new User({...req.body});
	var profilePhoto = req.body.profilePhoto;
	
	if(profilePhoto.length > 0){  //i.e. checking if the user has entered a photo url
		newUser.profilePhoto = profilePhoto;
	}else{
		newUser.profilePhoto = "../images/stock.png";
	}
	
	User.register(newUser, req.body.password, function(err, user){
    	if(err){
			 req.flash('error','That email is already registered!');
			 return res.redirect("/register");
	}
		//'else' not needed cuz have use return above
		passport.authenticate('local')(req, res, function(){
			req.flash('success','Thanks for Registering ' + user.username +'!')
			res.redirect('/items');
		});
		
	});
});


//show login form
router.get('/login',function(req, res){
	res.render('user/login.ejs', { page : "login"});
});

//authenticate user
router.post("/login", function (req, res, next) {
	
  passport.authenticate("local",
    {
      successRedirect: "/items",
      failureRedirect: "/login",
      failureFlash: true,
      successFlash: "Welcome to Rent-it, " + capitalizeFirstLetter(req.body.username) + "!"
    })(req, res);
	
});

//logout route
router.get('/logout',function(req, res){
	req.logout();
	req.flash('success','Successfully Logged Out !');
	res.redirect('/items');
});

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

//route to get userprofile
router.get('/users/:user_id', function(req, res){
	User.findById(req.params.user_id, function(err, foundUser){
		console.log(foundUser);
		if(err || foundUser==null) {
			console.log(err)
			req.flash('error', 'user not found')
			res.redirect('back')
		}
		else {
			// below is a very important chain of methods
			Item.find().where('author.id').equals(foundUser._id).exec(function(err, items){
				if(err) {console.log(err)}
				else {
					res.render("user/userprofile.ejs", {user : foundUser, items: items, page: 'profile'});
				}	
			})	
		}
	})
})

router.get('/forgot', function(req, res){
	res.render('user/forgotpassword.ejs', { alertmsg : "" });	
})

// 1. Create a token
// 2. find the user and post the token to the user model
// 3. send the token email to the users email (send details in just an alert box for now)

router.post('/forgot', function(req, res, next){
	
	async.waterfall([
		function(done){                                   // -1
			crypto.randomBytes(20, function(err, buf){
				var token = buf.toString('hex');
				done(err, token)
			})
		},
		
		function(token, done){                            // -2
			User.findOne({ email : req.body.email }, function(err, user){
				console.log(req.body.email);
				if(!user){
					req.flash('error','No account with that email address exists!');
					return res.redirect('/forgot');
				}
				
				user.resetPasswordToken   = token;
				user.resetPasswordExpires = Date.now() + 3600000; // i.e. one hour from now	
				
				user.save(function(err){
					done(err, user, token);
				})
			})
		},
		
		function(user, token, done){                      // -3
			res.render('user/forgotpassword.ejs', { alertmsg : "To Reset Your Password please copy this link in your browser : /reset/"+token })  
		}
	], function(err){
			if(err){
				return next(err);
				res.redirect('/forgot');
			}	
		}	
	)
})

router.get('/reset/:token', function(req, res){
	//first have to verify that the token is valid(if its actually asigned to a user) and also check if its expired
	User.findOne({ resetPasswordToken : req.params.token, resetPasswordExpires : {$gt : Date.now()} }, function(err, user){
		if(!user){
			req.flash('error', 'The Password Reset token is invalid or has expired!');
			return res.redirect('/forgot');
		}
		res.render('user/resetpassword.ejs', {token : req.params.token});
	})
})


// 1. find user through token
// 2. Check password
// 3. assign new pass to the user using setPassword method(provided by passport, hashes the password by its own) on user
// 4. clear the resetpasstoken and resetpassexpires field from the user model
// 5. save the updated user in DB and log in the user

router.post('/reset/:token', function(req, res) {
	
			User.findOne({ resetPasswordToken : req.params.token }, function(err, user) {       //-1
				if(!user){
					req.flash('error', 'The Password Reset token is invalid or has expired!');
					return res.redirect('/forgot');
				}
				if(req.body.password1.length > 0 && req.body.password1 === req.body.password2){                                   //-2    
					user.setPassword(req.body.password1, function(err){                           //-3
						user.resetPasswordToken   = undefined;                                     //-4
						user.resetPasswordExpires = undefined;
						
						user.save(function(){                                                      //-5
							req.logIn(user, function(){
								req.flash('success', 'Password updated Successfully!')
								res.redirect('/items')	
							})
						})
					})
				}
				else {
					req.flash('error', 'The passwords do not match. Please try again.')
					return res.redirect('back');
				}
			})
})

module.exports = router;