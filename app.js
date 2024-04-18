/******************************************************************************
ITE5315 – Project
I declare that this assignment is my own work in accordance with Humber Academic Policy.
No part of this assignment has been copied manually or electronically from any other source
(including web sites) or distributed to other students.
Name: Emma Zhang Student ID: N01587845 Date: 04/07/2024
******************************************************************************/

const express = require("express");
const appConfig = require("./package.json");
const app = express();
const db = require("./config/database");
const bodyParser = require("body-parser"); // pull information from HTML POST (express4)
const mongoose = require("mongoose");
const { engine } = require('express-handlebars');
const path = require('node:path');

const port = process.env.PORT || 8000;
app.use(bodyParser.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // parse application/json
app.use(bodyParser.json({ type: "application/vnd.api+json" })); // parse application/vnd.api+json as json

const { query, body, validationResult } = require('express-validator');

//modules to apply authentication
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const admin = {
  username: "admin",
  password: process.env.PASSWORD
}

// create GraphQL as a new function
const {ApolloServer} = require('apollo-server-express');
const typeDefs = require('./gql-schema');
const resolvers = require('./gql-resolvers');

const server = new ApolloServer({ typeDefs, resolvers });


app.engine('.hbs', engine({
    extname: '.hbs',
    //specify the folder partials are located
  partialsDir: path.join(__dirname, 'views', 'partials')
  }));
app.set('view engine', '.hbs');

// allow forms
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// middleware to check if the user is authenticated
const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  
  if(!token) return res.status(401).json({message: "Please login"});

  jwt.verify(token, process.env.SECRETKEY, (err, decoded) => {
    if (err) return res.status(403).json({message: "Invalid credential, failed to login"})

    req.user = decoded;
    next();
  });
}

app.post("/login", async (req, res) => {
    const {username, password} = req.body;
    // check the user's input
    if(username !== admin.username || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({message: "Invalid username or password"});
    }

    const accessToken = jwt.sign({ username: username }, process.env.SECRETKEY, {expiresIn: '1h'});
    res.cookie('token', accessToken);
    res.json({message: "Logged in successfully"});
})



// add a new restaurant document into the collection
app.post("/api/restaurants", verifyToken, async (req, res) => {
    try {  
      // get and return all the employees after newly created employe record
      const restaurant = await db.addNewRestaurant(req.body);
      if (restaurant) {
        res.json(restaurant);
      } else {
        res.status(400).json({message: "Failed to add a new restaurant!"})
      }      
    } catch (reason) {
      res.status(500).json(reason);
    }
  });

app.get("/api/restaurants", [
    //validate the query
    query('page').isNumeric().withMessage("Page must be a numeric value"),
    query('perPage').isNumeric().withMessage("perPage must be a numeric value"),
    query('borough').optional().isString().withMessage("Borough must be a string")
], async (req, res) => {
    const result = validationResult(req);
    //If the params are incorrect, return failure message
    if(!result.isEmpty()) {
        return res.status(400).send({errors: result.array()});
    }
   // otherwise, call db.getAllRestaurants to retrieve restaurants
   const {page, perPage, borough} = req.query;
   try {
    const restaurants = await db.getAllRestaurants(parseInt(page), parseInt(perPage), borough);
    if (restaurants) {
        res.json(restaurants);
    } else {
        res.status(400).json({message: "Failed to retrieve restaurants!"})
    }   
  } catch (reason) {
    res.status(500).json(reason);
  }
});

//get query form
app.get('/restaurants', (req, res) => {
    res.render('partials/form', {
        title: 'Search Form'
    });
});

//return form and result
app.post("/restaurants", [
    //validate the query
    body('page').isNumeric().withMessage("Page must be a numeric value"),
    body('perPage').isNumeric().withMessage("perPage must be a numeric value"),
    body('borough').optional().isString().withMessage("Borough must be a string")
], async (req, res) => {
    const errors = validationResult(req);
    //If the params are incorrect, return failure message
    if(!errors.isEmpty()) {
        return res.render('results', {
            errors: errors.array(),
            title: 'Validation Errors'
        });
    }
   // otherwise, call db.getAllRestaurants to retrieve restaurants
   const {page, perPage, borough} = req.body;
   try {
    const restaurants = await db.getAllRestaurants(parseInt(page), parseInt(perPage), borough);
    console.log("Restaurants data:", restaurants);
    if (restaurants.length) {
        res.render('results', {
            restaurants: restaurants,
            title: 'Search results',
            request: { borough, page } 
        });
    } else {
        res.render('results', {
            errors: [{msg: "No restaurants found!"}],
            title: 'No Restaurants Found'
        });
    }   
  } catch (reason) {
    res.status(500).render('result', {
        errors: [{msg: "Server error occurred while retrieving restaurants."}],
        title: 'Server Error'
    })
  }
});

// get restaurant by id
app.get("/api/restaurants/:restaurant_id", async (req, res) => {
    const id = req.params.restaurant_id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: "Invalid ID format. ID must be a 24-character hexadecimal string."
        });
    }
  try {
    const restaurant = await db.getRestaurantById(id);

    if (restaurant) {
        res.json(restaurant);
    } else {
        res.status(404).json({message: "Failed to retrieve the restaurant, please check the restaurant id!"})
    }   
  } catch (reason) {
    res.status(500).json(reason);
  }
});

// update a restaurant by id
app.put("/api/restaurants/:restaurant_id", verifyToken, async (req, res) => {
    const id = req.params.restaurant_id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: "Invalid ID format. ID must be a 24-character hexadecimal string."
        });
    }
  try {
    //construct parameter data
    const data = {
        address: req.body.address,
        borough: req.body.borough,
        cuisine: req.body.cuisine,
        grades: req.body.grades,
        name: req.body.name
    };
    //call the db update method to update the restaurant in the collection
    const restaurant = await db.updateRestaurantById(data, id);
    if (restaurant) {
        res.json({ msg: "Success! Restaurant updated - " + restaurant.name });
    } else {
        res.status(404).json({message: "Failed to update the restaurant, please check the restaurant id!"})
    }
    
  } catch (reason) {
    res.status(500).json(reason);
  }
});

// delete a restaurant by id
app.delete("/api/restaurants/:restaurant_id", verifyToken, async (req, res) => {
    const id = req.params.restaurant_id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: "Invalid ID format. ID must be a 24-character hexadecimal string."
        });
    }
  try {
    const deleteResult = await db.deleteRestaurantById(id);
    if (deleteResult) {
        res.json({ msg: "Success! Restaurant has been Deleted." });
    } else {
        res.status(404).json({message: "Failed to delete the restaurant, please check the restaurant id!"})
    }   
  } catch (reason) {
    res.status(500).json(reason);
  }
});



// Initialize the database
db.initialize().then(() => {
  // Start the Apollo Server
  server.start().then(() => {
      // Apply Apollo middleware to the Express application
      server.applyMiddleware({ app, path: '/graphql' });

      // Start the Express server
      app.listen(port, () => {
          console.log(`${appConfig.name} listening on http://localhost:${port}${server.graphqlPath}`);
      });
  }).catch(error => {
      console.error('Failed to start Apollo Server:', error);
  });
}).catch(error => {
  console.error('Failed to initialize the database:', error);
});

// db.initialize().then(() => {
//     app.listen(port, () => {
//         console.log(`${appConfig.name} listening on port: http://localhost:${port}${server.graphqlPath}`);
//       });
// }).catch(error => {
//     console.error('Failed to start the server: ', error);
// })
