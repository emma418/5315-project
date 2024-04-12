/******************************************************************************
ITE5315 – Project
I declare that this assignment is my own work in accordance with Humber Academic Policy.
No part of this assignment has been copied manually or electronically from any other source
(including web sites) or distributed to other students.
Name: Emma Zhang Student ID: N01587845 Date: 04/07/2024
******************************************************************************/

require("dotenv").config();
const mongoose = require("mongoose");
const Restaurant = require("../models/restaurant");

const db = {};

//initialize a data connection
db.initialize = async() => {
  try {
    await mongoose.connect(process.env.DB_CONNECTION_STRING);
    console.log("Database connected successfully");
  } catch(error) {
      console.error("Database connection failed", error);
    }
  };
//add a new restaurant into the collection
db.addNewRestaurant = async(data) => {  
  return await Restaurant.create(data)
  
};

db.getAllRestaurants = async(page, perPage, borough) => {
  //create a query if borough is provided
  const query = borough ? {borough} : {}
  return await Restaurant.find(query)
                  //sort by restaurant id
                   .sort({restaurant_id:1})
                   //return the page required
                   .skip((page - 1) * perPage)
                   //set the number of documents per page
                   .limit(perPage)
                   .lean();
}
//method to get a restaurant by id
db.getRestaurantById = async(Id) => {
  return await Restaurant.findById(Id);
}
//method to update a restaurant based on its id
db.updateRestaurantById = async(data, Id) => {
  return await Restaurant.findByIdAndUpdate(Id, data);
}
//method to delete a restaurant based on id
db.deleteRestaurantById = async(Id) => {
  try {
    return await Restaurant.findByIdAndDelete(Id);
} catch (error) {
    console.error("Failed to delete restaurant:", error);
    throw error;  // Ensure that errors are re-thrown and can be caught by the caller
}
}

module.exports = db;




