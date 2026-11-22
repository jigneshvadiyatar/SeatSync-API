
const eventService = require("../services/event.service");

const createEvent = async (req, res, next) => {
  try {
    const event = await eventService.createEvent(req.body);

    return res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: { event },
    });
  } catch (error) {
    next(error);
  }
};

const getEvents = async (req, res, next) => {
  try {
    const result = await eventService.getEvents(
      req.query,
      req.user?.role === "admin"
    );

    return res.status(200).json({
      success: true,
      message: "Events retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getEventById = async (req, res, next) => {
  try {
    const event = await eventService.getEventById(
      req.params.id,
      req.user?.role === "admin"
    );

    return res.status(200).json({
      success: true,
      message: "Event retrieved successfully",
      data: { event },
    });
  } catch (error) {
    next(error);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    const event = await eventService.updateEvent(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Event updated successfully",
      data: { event },
    });
  } catch (error) {
    next(error);
  }
};

const publishEvent = async (req, res, next) => {
  try {
    const event = await eventService.publishEvent(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: "Event published successfully",
      data: { event },
    });
  } catch (error) {
    next(error);
  }
};

const unpublishEvent = async (req, res, next) => {
  try {
    const event = await eventService.unpublishEvent(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: "Event unpublished successfully",
      data: { event },
    });
  } catch (error) {
    next(error);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    const result = await eventService.deleteEvent(
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

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  publishEvent,
  unpublishEvent,
  deleteEvent,
};
