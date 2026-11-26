
import * as seatService from "../services/seat.service.js";

const createCategory = async (req, res, next) => {
  try {
    const category = await seatService.createCategory(
      req.params.hallId,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Seat category created successfully",
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await seatService.getCategories(
      req.params.hallId,
      req.user?.role === "admin"
    );

    return res.status(200).json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await seatService.updateCategory(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

const createSeatsBulk = async (req, res, next) => {
  try {
    const result = await seatService.createSeatsBulk(
      req.params.hallId,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Seats created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSeats = async (req, res, next) => {
  try {
    const seats = await seatService.getSeats(
      req.params.hallId,
      req.user?.role === "admin"
    );

    return res.status(200).json({
      success: true,
      data: {
        count: seats.length,
        seats,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getSeatLayout = async (req, res, next) => {
  try {
    const layout = await seatService.getSeatLayout(
      req.params.hallId,
      req.user?.role === "admin"
    );

    return res.status(200).json({
      success: true,
      data: layout,
    });
  } catch (error) {
    next(error);
  }
};

const updateSeat = async (req, res, next) => {
  try {
    const seat = await seatService.updateSeat(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Seat updated successfully",
      data: { seat },
    });
  } catch (error) {
    next(error);
  }
};

const deleteSeat = async (req, res, next) => {
  try {
    const result = await seatService.deactivateSeat(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export {
  createCategory,
  getCategories,
  updateCategory,
  createSeatsBulk,
  getSeats,
  getSeatLayout,
  updateSeat,
  deleteSeat,
};
