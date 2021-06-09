if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
} // dotenv is not for production! only loads up the variables from .env when in development(localhost) 
//for production in heroku, u need to add all env variables seperately
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
// const helmet = require('helmet');

//requiring routes
const indexRoutes = require('./routes/index.js')
const itemRoutes = require('./routes/items.js')
const reviewRoutes = require('./routes/reviews.js')


//====================DATABASE CONNECTION==========================
const dbUrl = process.env.MY_MONGODB_URI || "mongodb://localhost:27017/rent_it"

const connectDB = async () => {
	try {
		await mongoose.connect(dbUrl, {
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
// app.use(helmet());



// app.locals.moment = require('moment'); //to use moment as a variable everywhere(like global)


//=========SESSION CONFIG======================
const store = MongoStore.create({
	mongoUrl: dbUrl,
	touchAfter: 24 * 60 * 60,
	crypto: {
		secret: process.env.SECRET || secret
	}
});

store.on('error', e => {
	console.log('mongo-session error: ', e)
})

app.use(
	session({
		store: store,
		secret: process.env.SECRET || "secret",
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

const port = process.env.PORT || 3000

app.listen(port, function () {
	console.log(`SERVER listening on port ${port}!`);
});