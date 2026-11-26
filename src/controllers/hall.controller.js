
import * as hallService from "../services/hall.service.js";

const createHall = async (req, res, next) => {
  try {
    const hall = await hallService.createHall(
      req.params.venueId,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Hall created successfully",
      data: { hall },
    });
  } catch (error) {
    next(error);
  }
};

const getHalls = async (req, res, next) => {
  try {
    const result = await hallService.getHalls(
      req.params.venueId,
      req.query,
      req.user?.role === "admin"
    );

    return res.status(200).json({
      success: true,
      message: "Halls retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getHallById = async (req, res, next) => {
  try {
    const hall = await hallService.getHallById(
      req.params.id,
      req.user?.role === "admin"
    );

    return res.status(200).json({
      success: true,
      message: "Hall retrieved successfully",
      data: { hall },
    });
  } catch (error) {
    next(error);
  }
};

const updateHall = async (req, res, next) => {
  try {
    const hall = await hallService.updateHall(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Hall updated successfully",
      data: { hall },
    });
  } catch (error) {
    next(error);
  }
};

const deleteHall = async (req, res, next) => {
  try {
    const result = await hallService.deleteHall(
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
  createHall,
  getHalls,
  getHallById,
  updateHall,
  deleteHall,
};
