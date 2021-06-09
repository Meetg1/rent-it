var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');

var UserSchema = new mongoose.Schema({
	firstname:  String,
	lastname :  String,
	insta :  String,
	fb :  String,
	mobile: String,
	address: String,
	email    :  {type: String, unique: true, required: true},
	profilePhoto: String,
	resetPasswordToken:   String,
	resetPasswordExpires: Date,
	isAdmin :  { type: Boolean, default: false},
	reviews : [
            {
	            type : mongoose.Schema.Types.ObjectId,
	            ref  : 'review'
            }     
	]
});

UserSchema.plugin(passportLocalMongoose); //to use methods such as User.register on our user DB.



module.exports = mongoose.model('RentUser',UserSchema);