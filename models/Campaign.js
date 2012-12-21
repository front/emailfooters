var mongoose = require('mongoose');
var Schema = mongoose.Schema;



var Campaign = new Schema({ 
	title: String,
	body: String, 
	url: String, 
	image: String, 
	addlogo: Boolean, 
	schedule: String, 
	internal_title: String, 
	image: String
});
// var Campaign = mongoose.model('Campaign', Campaign);

// var testCamp = new Campaign({ 
// 	title: 'foo',
// 	body: 'bar ', 
// 	url: 'baz', 
// 	image: 'qux', 
// 	addloop: 'foobar', 
// 	schedule: 'foobaz', 
// 	internal_title: 'barbaz',  
// });

// testCamp.save(function (err) {
//   if (err) // ...
//   console.log('test model saved');
// });

module.exports = mongoose.model('Campaign', Campaign);