import * as service from "../services/booking.service.js";

export const createBooking = async (req, res) => {
  const { booking, created } = await service.createBooking(
    req.user.id, req.body.holdId, req.get("Idempotency-Key")
  );
  res.status(created ? 201 : 200).json({ success: true, data: booking });
};

export const getBooking = async (req, res) => {
  const data = await service.getBooking(req.params.id, req.user.id);
  res.json({ success: true, data });
};

export const cancelBooking = async (req, res) => {
  const data = await service.cancelBooking(req.params.id, req.user.id);
  res.json({ success: true, data });
};

export const listBookings = async (req, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const data = await service.listBookings(req.user.id, page, limit);
  res.json({ success: true, data });
};
