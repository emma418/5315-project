const Restaurant  = require('./models/restaurant'); 

const resolvers = {
  Query: {
    getRestaurantById: async (_, { id }) => {
      // Retrieve a restaurant by its ID
      return await Restaurant.findById(id);
    },
    getRestaurants: async (_, { borough, cuisine, limit }) => {
      // Build the query based on optional filter parameters
      const query = {};
      if (borough) query.borough = borough;
      if (cuisine) query.cuisine = cuisine;

      // Retrieve and return restaurants based on the query, with a limit if provided
      return await Restaurant.find(query).limit(limit);
    },
  },
  Mutation: {
    addRestaurant: async (_, { name, restaurant_id, borough, cuisine, address, grades }) => {
      // Create a new restaurant using the provided details
      const newRestaurant = new Restaurant({
        name,
        restaurant_id,
        borough,
        cuisine,
        address,
        grades
      });
      // Save the new restaurant to the database
      return await newRestaurant.save();
    },
    updateRestaurant: async (_, { id, name, borough, cuisine, address }) => {
      // Update the restaurant with the given ID
      const updateFields = {};
      if (name) updateFields.name = name;
      if (borough) updateFields.borough = borough;
      if (cuisine) updateFields.cuisine = cuisine;
      if (address) updateFields.address = address;

      return await Restaurant.findByIdAndUpdate(id, updateFields, { new: true });
    },
    deleteRestaurant: async (_, { id }) => {
      // Remove the restaurant with the given ID from the database
      const result = await Restaurant.findByIdAndDelete({ _id: id });
      if (result) {
        return `Restaurant with ID ${id} was deleted.`;
      } else {
        throw new Error(`Restaurant with ID ${id} not found.`)
      }
      
    },
  },
};

module.exports = resolvers;
