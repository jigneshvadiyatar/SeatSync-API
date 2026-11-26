import * as eventService from "../services/event.service.js";

import * as showService from "../services/show.service.js";

const createShow = async (req, res, next) => {
  try {
    const show = await showService.createShow(req.body);

    return res.status(201).json({
      success: true,
      message: "Show scheduled successfully",
      data: { show },
    });
  } catch (error) {
    next(error);
  }
};

const getShows = async (req, res, next) => {
  try {
    const result = await showService.getShows(
      req.query,
      req.user?.role === "admin"
    );

    return res.status(200).json({
      success: true,
      message: "Shows retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getShowById = async (req, res, next) => {
  try {
    const show = await showService.getShowById(
      req.params.id,
      req.user?.role === "admin"
    );

    return res.status(200).json({
      success: true,
      message: "Show retrieved successfully",
      data: { show },
    });
  } catch (error) {
    next(error);
  }
};

const updateShow = async (req, res, next) => {
  try {
    const show = await showService.updateShow(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Show updated successfully",
      data: { show },
    });
  } catch (error) {
    next(error);
  }
};

const updateShowPrices = async (req, res, next) => {
  try {
    const show = await showService.updateShowPrices(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Show prices updated successfully",
      data: { show },
    });
  } catch (error) {
    next(error);
  }
};

const cancelShow = async (req, res, next) => {
  try {
    const show = await showService.cancelShow(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: "Show cancelled successfully",
      data: { show },
    });
  } catch (error) {
    next(error);
  }
};

const getEventShows = async (req, res) => {
  const admin = req.user?.role === "admin";
  const event = await eventService.getEventById(req.params.id, admin);
  const data = await showService.getShows({ ...req.query, event_id: event.id }, admin);
  res.json({ success: true, data });
};

export {
  getEventShows,
  createShow,
  getShows,
  getShowById,
  updateShow,
  updateShowPrices,
  cancelShow,
};
