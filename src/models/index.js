const sequelize = require("../config/database");

const User = require("./user.model");
const UserSession = require("./userSession.model");
const Venue = require("./venue.model");
const Hall = require("./hall.model");
const SeatCategory = require("./seatCategory.model");
const Seat = require("./seat.model");
const Event = require("./event.model");
const Show = require("./show.model");
const ShowSeatPrice = require("./show-seat-price.model");

// User -> UserSession
User.hasMany(UserSession, {
  foreignKey: "user_id",
  as: "sessions",
  onDelete: "CASCADE",
});

UserSession.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

// Venue -> Hall
Venue.hasMany(Hall, {
  foreignKey: "venue_id",
  as: "halls",
  onDelete: "RESTRICT",
});

Hall.belongsTo(Venue, {
  foreignKey: "venue_id",
  as: "venue",
});

// Hall -> SeatCategory

Hall.hasMany(SeatCategory, {
  foreignKey: "hall_id",
  as: "seatCategories",
});

SeatCategory.belongsTo(Hall, {
  foreignKey: "hall_id",
  as: "hall",
});

Hall.hasMany(Seat, {
  foreignKey: "hall_id",
  as: "seats",
});

Seat.belongsTo(Hall, {
  foreignKey: "hall_id",
  as: "hall",
});

SeatCategory.hasMany(Seat, {
  foreignKey: "category_id",
  as: "seats",
  constraints: false,
});

Seat.belongsTo(SeatCategory, {
  foreignKey: "category_id",
  as: "category",
  constraints: false,
});

// Event <-> Show
Event.hasMany(Show, {
  foreignKey: "event_id",
  as: "shows",
});

Show.belongsTo(Event, {
  foreignKey: "event_id",
  as: "event",
});

// Hall <-> Show
Hall.hasMany(Show, {
  foreignKey: "hall_id",
  as: "shows",
});

Show.belongsTo(Hall, {
  foreignKey: "hall_id",
  as: "hall",
});

// Show <-> ShowSeatPrice
Show.hasMany(ShowSeatPrice, {
  foreignKey: "show_id",
  as: "seatPrices",
});

ShowSeatPrice.belongsTo(Show, {
  foreignKey: "show_id",
  as: "show",
});

// SeatCategory <-> ShowSeatPrice
SeatCategory.hasMany(ShowSeatPrice, {
  foreignKey: "seat_category_id",
  as: "showPrices",
});

ShowSeatPrice.belongsTo(SeatCategory, {
  foreignKey: "seat_category_id",
  as: "seatCategory",
});


module.exports = {
  sequelize,
  User,
  UserSession,
  Venue,
  Hall,
  SeatCategory,
  Seat,
  Event,
  Show,
  ShowSeatPrice
};
