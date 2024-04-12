const mongoose = require("mongoose");
const Schema = mongoose.Schema;

addressSchema = new Schema ({
    building: String,
    coord: Array,
    street: String,
    zipcode: String
}, {_id : false});

gradeSchema = new Schema ({
    date: Date,
    grade: String,
    score: Number
}, {_id : false});

RestaurantSchema = new Schema({
    address: addressSchema,
    borough: String,
    cuisine: String,
    grades: [gradeSchema],
    name: String,
    restaurant_id: { type: String, required: true, unique: true}
}, {collection: 'restaurants'});

module.exports = mongoose.model("Restaurant", RestaurantSchema);