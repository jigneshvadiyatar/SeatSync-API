import sequelize from "../config/database.js";

import User from "./user.model.js";
import UserSession from "./userSession.model.js";
import Venue from "./venue.model.js";
import Hall from "./hall.model.js";
import SeatCategory from "./seatCategory.model.js";
import Seat from "./seat.model.js";
import Event from "./event.model.js";
import Show from "./show.model.js";
import ShowSeatPrice from "./show-seat-price.model.js";
import SeatHold from "./seatHold.model.js";
import SeatHoldItem from "./seatHoldItem.model.js";
import Booking from "./booking.model.js";
import BookingItem from "./bookingItem.model.js";
import ShowSeatAllocation from "./showSeatAllocation.model.js";

// ── User ↔ UserSession ───────────────────────────────────────────────────────
User.hasMany(UserSession, { foreignKey: "user_id", as: "sessions", onDelete: "CASCADE" });
UserSession.belongsTo(User, { foreignKey: "user_id", as: "user" });

// ── Venue ↔ Hall ─────────────────────────────────────────────────────────────
Venue.hasMany(Hall, { foreignKey: "venue_id", as: "halls", onDelete: "RESTRICT" });
Hall.belongsTo(Venue, { foreignKey: "venue_id", as: "venue" });

// ── Hall ↔ SeatCategory ──────────────────────────────────────────────────────
Hall.hasMany(SeatCategory, { foreignKey: "hall_id", as: "seatCategories" });
SeatCategory.belongsTo(Hall, { foreignKey: "hall_id", as: "hall" });

// ── Hall ↔ Seat ───────────────────────────────────────────────────────────────
Hall.hasMany(Seat, { foreignKey: "hall_id", as: "seats" });
Seat.belongsTo(Hall, { foreignKey: "hall_id", as: "hall" });

// ── SeatCategory ↔ Seat ───────────────────────────────────────────────────────
SeatCategory.hasMany(Seat, { foreignKey: "category_id", as: "seats", constraints: false });
Seat.belongsTo(SeatCategory, { foreignKey: "category_id", as: "category", constraints: false });

// ── Event ↔ Show ─────────────────────────────────────────────────────────────
Event.hasMany(Show, { foreignKey: "event_id", as: "shows" });
Show.belongsTo(Event, { foreignKey: "event_id", as: "event" });

// ── Hall ↔ Show ───────────────────────────────────────────────────────────────
Hall.hasMany(Show, { foreignKey: "hall_id", as: "shows" });
Show.belongsTo(Hall, { foreignKey: "hall_id", as: "hall" });

// ── Show ↔ ShowSeatPrice ─────────────────────────────────────────────────────
Show.hasMany(ShowSeatPrice, { foreignKey: "show_id", as: "seatPrices" });
ShowSeatPrice.belongsTo(Show, { foreignKey: "show_id", as: "show" });

// ── SeatCategory ↔ ShowSeatPrice ─────────────────────────────────────────────
SeatCategory.hasMany(ShowSeatPrice, { foreignKey: "seat_category_id", as: "showPrices" });
ShowSeatPrice.belongsTo(SeatCategory, { foreignKey: "seat_category_id", as: "seatCategory" });

// ── SeatHold ↔ Show / User ───────────────────────────────────────────────────
Show.hasMany(SeatHold, { foreignKey: "show_id", as: "holds" });
SeatHold.belongsTo(Show, { foreignKey: "show_id", as: "show" });

User.hasMany(SeatHold, { foreignKey: "user_id", as: "holds" });
SeatHold.belongsTo(User, { foreignKey: "user_id", as: "user" });

// ── SeatHold ↔ SeatHoldItem ──────────────────────────────────────────────────
SeatHold.hasMany(SeatHoldItem, { foreignKey: "hold_id", as: "items", onDelete: "CASCADE" });
SeatHoldItem.belongsTo(SeatHold, { foreignKey: "hold_id", as: "hold" });

SeatHoldItem.belongsTo(Seat, { foreignKey: "seat_id", as: "seat" });
Seat.hasMany(SeatHoldItem, { foreignKey: "seat_id", as: "holdItems" });

// ── ShowSeatAllocation ────────────────────────────────────────────────────────
Show.hasMany(ShowSeatAllocation, { foreignKey: "show_id", as: "allocations" });
ShowSeatAllocation.belongsTo(Show, { foreignKey: "show_id", as: "show" });

Seat.hasMany(ShowSeatAllocation, { foreignKey: "seat_id", as: "allocations" });
ShowSeatAllocation.belongsTo(Seat, { foreignKey: "seat_id", as: "seat" });

Booking.hasMany(BookingItem, { foreignKey: "booking_id", as: "items" });
BookingItem.belongsTo(Booking, { foreignKey: "booking_id", as: "booking" });

export {
  Booking,
  BookingItem,
  sequelize,
  User,
  UserSession,
  Venue,
  Hall,
  SeatCategory,
  Seat,
  Event,
  Show,
  ShowSeatPrice,
  SeatHold,
  SeatHoldItem,
  ShowSeatAllocation,
};
