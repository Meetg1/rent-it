require('dotenv').config();
const express = require('express')
const app = express()
const mongoose = require('mongoose')
const methodOverride = require('method-override')
const path = require("path");
const User = require('./models/user.js')
const session = require("express-session");
const passport = require('passport')
const LocalStrategy = require('passport-local')
const flash = require('connect-flash')
const MongoStore = require('connect-mongo');

//requiring routes
const indexRoutes = require('./routes/index.js')
const itemRoutes = require('./routes/items.js')
const reviewRoutes = require('./routes/reviews.js')


//====================DATABASE CONNECTION==========================
const db = process.env.MY_MONGODB_URI;

const connectDB = async () => {
	try {
		await mongoose.connect(db, {
			useUnifiedTopology: true,
			useNewUrlParser: true,
			useFindAndModify: false,
			useCreateIndex: true,
		});
		console.log("DATABASE CONNECTED");
	} catch (err) {
		console.error(err.message);
		process.exit(1);
	}
};
// CONNECT DATABASE
connectDB();

app.use(express.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public"))); //for serving static files

app.use(express.urlencoded({
	extended: true
})); //for parsing form data

app.use(methodOverride('_method')); // to use put and delete methods
app.use(flash());



// app.locals.moment = require('moment'); //to use moment as a variable everywhere(like global)


//=========SESSION CONFIG======================
const store = MongoStore.create({
	mongoUrl: dbUrl,
	touchAfter: 24 * 60 * 60,
	crypto: {
		secret: process.env.SECRET
	}
});

store.on('error', e => {
	console.log('mongo-session error: ', e)
})

app.use(
	session({
		store: store,
		secret: process.env.SECRET,
		resave: true,
		saveUninitialized: true,
	})
);


//=============passport config======================
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//===================================================

app.use(function (req, res, next) {
	res.locals.currentUser = req.user; //giving access of loggedIn user to every templates(in views dir)
	res.locals.error = req.flash('error'); //providing req.flash(if generated) to all the templates
	res.locals.success = req.flash('success');
	next();
});


app.use(indexRoutes);
app.use(itemRoutes);
app.use(reviewRoutes);

app.get('*', (req, res) => {
	res.render('notfound.ejs');
})

// code to make someone admin
//  User.findById("5f058357051df71fbff89018", function(err, user){
// 	user.isAdmin = true;
// 	user.save();
//    console.log(user); 
//  });

app.listen(3000, function () {
	console.log("SERVER HAS STARTED!!");
});