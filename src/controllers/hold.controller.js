import * as holds from "../services/hold.service.js";

const createHold = async (req, res) => {
  const data = await holds.createHold(req.params.showId, req.user.id, req.body.seatIds);
  res.status(201).json({ success: true, data });
};

const getHold = async (req, res) => {
  const data = await holds.getHold(req.params.holdId, req.user.id);
  res.json({ success: true, data });
};

const releaseHold = async (req, res) => {
  await holds.releaseHold(req.params.holdId, req.user.id);
  res.sendStatus(204);
};

const getAvailability = async (req, res) => {
  const data = await holds.getAvailability(req.params.showId, req.user);
  res.json({ success: true, data });
};

const getShowSeats = async (req, res) => {
  const data = await holds.getAvailability(req.params.showId, req.user, false);
  res.json({ success: true, data });
};

export { createHold, getHold, releaseHold, getAvailability, getShowSeats };
