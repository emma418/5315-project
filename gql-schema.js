const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Restaurant {
    id: ID!
    name: String!
    restaurant_id: String!
    borough: String
    cuisine: String
    address: Address
    grades: [Grade]
  }

  type Address {
    building: String
    street: String
    zipcode: String
    coord: [Float]
  }

  type Grade {
    date: String
    grade: String
    score: Int
  }

  type Query {
    getRestaurantById(id: ID!): Restaurant
    getRestaurants(borough: String, cuisine: String, limit: Int): [Restaurant]
  }

  type Mutation {
    addRestaurant(
      name: String!,
      restaurant_id: String!,
      borough: String,
      cuisine: String,
      address: AddressInput,
      grades: [GradeInput]
    ): Restaurant
    addGradeToRestaurant(
      restaurant_id: String!,
      grade: GradeInput
    ): Restaurant
    updateRestaurant(
      id: ID!,
      name: String,
      borough: String,
      cuisine: String,
      address: AddressInput
    ): Restaurant
    deleteRestaurant(id: ID!): String
  }

  input AddressInput {
    building: String
    street: String
    zipcode: String
    coord: [Float]
  }

  input GradeInput {
    date: String
    grade: String
    score: Int
  }
`;

module.exports = typeDefs;

