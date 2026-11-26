import "dotenv/config";
import assert from "node:assert/strict";
import { once } from "node:events";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import pg from "pg";
import jwt from "jsonwebtoken";

const root = fileURLToPath(new URL("../", import.meta.url));

const serve = async (t, app) => {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const api = async (method, path, expected, { body, token, headers = {} } = {}) => {
    const response = await fetch(`${origin}/api/v1${path}`, {
      method,
      headers: {
        ...headers,
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const payload = response.status === 204 ? null : await response.json();
    assert.equal(response.status, expected, `${method} ${path} ${JSON.stringify(payload)}`);
    return payload?.data;
  };
  api.origin = origin;
  return api;
};

const integration = process.env.SEATSYNC_INTEGRATION === "1";

test("health route starts without connecting to infrastructure", { skip: integration }, async (t) => {
  const { default: app } = await import("../src/app.js");
  const api = await serve(t, app);
  await api("GET", "/health/live", 200);
  await api("POST", `/shows/${randomUUID()}/holds`, 401, { body: { seatIds: [] } });
});

test("modules 0-7 with a disposable PostgreSQL database", { skip: !integration }, async (t) => {
  const database = `seatsync_test_${randomUUID().replaceAll("-", "")}`;
  const client = new pg.Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "postgres",
  });
  await client.connect();
  try {
    await client.query(`CREATE DATABASE "${database}"`);
  } catch (error) {
    await client.end();
    throw error;
  }
  process.env.DB_NAME = database;
  process.env.DB_TEST_NAME = database;
  process.env.JWT_ACCESS_SECRET = "local-integration-test-only";
  process.env.SEAT_HOLD_TTL_SECONDS = "300";
  let sequelize;
  let cleaned = false;
  const cleanup = async () => {
    if (cleaned) return;
    cleaned = true;
    if (sequelize) await sequelize.close();
    try {
      await client.query(`DROP DATABASE "${database}" WITH (FORCE)`);
    } finally {
      await client.end();
    }
  };
  t.after(cleanup);

  const cli = fileURLToPath(new URL("../node_modules/sequelize-cli/lib/sequelize", import.meta.url));
  const migrate = (command = "db:migrate") => execFileSync(process.execPath, [cli, command, "--env", "test",
    "--options-path", ".sequelizerc.cjs"], { cwd: root, encoding: "utf8" });
  migrate();
  assert.match(migrate(), /No migrations were executed/);
  assert.match(migrate("db:migrate:undo"), /create-bookings: reverted/);
  assert.match(migrate(), /create-bookings: migrated/);

  const { default: app } = await import("../src/app.js");
  const models = await import("../src/models/index.js");
  sequelize = models.sequelize;
  const { expireStaleHolds } = await import("../src/repositories/hold.repository.js");
  const api = await serve(t, app);

  await api("GET", "/health/ready", 200);
  const password = "Local-test-password-22!";
  const register = (email) => api("POST", "/auth/register", 201, {
    body: { name: "Test User", email, password, role: "admin" },
  });
  const { user: admin } = await register("admin@example.com");
  assert.equal(admin.role, "user");
  await register("buyer@example.com");
  await register("other@example.com");
  await models.User.update({ role: "admin" }, { where: { id: admin.id } });
  const login = (email) => api("POST", "/auth/login", 200, { body: { email, password } });
  const { accessToken: adminToken } = await login(admin.email);
  const { accessToken: buyerToken, refreshToken } = await login("buyer@example.com");
  const { accessToken: otherToken } = await login("other@example.com");
  const buyerProfile = await api("GET", "/users/me", 200, { token: buyerToken });
  assert.ok(buyerProfile);
  assert.equal(JSON.stringify(buyerProfile).includes("password_hash"), false);
  await api("GET", "/users", 403, { token: buyerToken });
  const { users } = await api("GET", "/users?search=buyer", 200, { token: adminToken });
  assert.equal(users.length, 1);
  const rotated = await api("POST", "/auth/refresh", 200, { body: { refreshToken } });
  await api("POST", "/auth/refresh", 401, { body: { refreshToken } });
  await api("GET", "/auth/me", 200, { token: rotated.accessToken });
  await api("GET", "/auth/me", 401, { token: "invalid-token" });
  const { sub, sid } = jwt.decode(rotated.accessToken);
  const expiredToken = jwt.sign({ sid }, process.env.JWT_ACCESS_SECRET, { subject: sub, expiresIn: -1 });
  await api("GET", "/auth/me", 401, { token: expiredToken });

  const adminRequest = (method, path, expected, body) => api(method, path, expected, { token: adminToken, body });
  const { venue } = await adminRequest("POST", "/venues", 201, {
    name: "Venue One", address: "123 Test Road", city: "Test City",
  });
  const { venue: inactiveVenue } = await adminRequest("POST", "/venues", 201, {
    name: "Venue Two", address: "124 Test Road", city: "Test City",
  });
  await adminRequest("DELETE", `/venues/${inactiveVenue.id}`, 200);
  const activeAndInactive = await adminRequest("GET", "/venues?is_active=all", 200);
  assert.equal(activeAndInactive.venues.length, 2);

  const { hall } = await adminRequest("POST", `/venues/${venue.id}/halls`, 201, {
    name: "Hall One", code: "H1", capacity: 3,
  });
  const { category } = await adminRequest("POST", `/halls/${hall.id}/seat-categories`, 201, {
    name: "Standard", code: "STD", base_price: "150.00",
  });
  const bulk = await adminRequest("POST", `/halls/${hall.id}/seats/bulk`, 201, {
    rows: [{ row: "A", from: "1", to: "3", categoryId: category.id }],
  });
  const [first, second, third] = bulk.seats.map(({ id }) => id);
  await adminRequest("PATCH", `/halls/${hall.id}`, 409, { capacity: 2 });
  await adminRequest("DELETE", `/seats/${third}`, 200);
  await adminRequest("PATCH", `/seats/${third}`, 200, { is_active: true });

  const { event } = await adminRequest("POST", "/events", 201, { title: "Test concert", category: "concert" });
  const showInput = {
    event_id: event.id, hall_id: hall.id,
    starts_at: new Date(Date.now() + 3_600_000).toISOString(),
    ends_at: new Date(Date.now() + 7_200_000).toISOString(),
    seat_category_prices: [{ seat_category_id: category.id, price: "199.00" }],
  };
  await api("GET", `/events/${event.id}`, 404);
  await adminRequest("POST", "/shows", 409, showInput);
  await adminRequest("PATCH", `/events/${event.id}/publish`, 200);
  const { show } = await adminRequest("POST", "/shows", 201, showInput);
  await adminRequest("POST", "/shows", 409, showInput);
  const eventShows = await api("GET", `/events/${event.id}/shows`, 200);
  assert.equal(eventShows.shows.length, 1);
  const showPath = `/shows/${show.id}`;
  const layout = await api("GET", `${showPath}/seats`, 200);
  assert.equal(layout.seats.length, 3);
  assert.ok(layout.seats.every(({ price }) => Number(price) === 199));

  const holdSeats = (seatIds, expected) => api("POST", `${showPath}/holds`, expected, { token: buyerToken, body: { seatIds } });
  await holdSeats([first, first.toUpperCase()], 422);
  await holdSeats([first, randomUUID()], 422);

  const contenders = await Promise.all(Array.from({ length: 50 }, async () => {
    const response = await fetch(`${api.origin}/api/v1${showPath}/holds`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({ seatIds: [first] }),
    });
    return { status: response.status, payload: await response.json() };
  }));
  assert.equal(contenders.filter(({ status }) => status === 201).length, 1);
  assert.equal(contenders.filter(({ status }) => status === 409).length, 49);
  const winner = contenders.find(({ status }) => status === 201).payload.data;

  await holdSeats([first, second], 409);
  await adminRequest("PATCH", `${showPath}/cancel`, 409);
  await adminRequest("PATCH", `/events/${event.id}/unpublish`, 409);
  await adminRequest("DELETE", `/venues/${venue.id}`, 409);
  await adminRequest("DELETE", `/halls/${hall.id}`, 409);
  await adminRequest("DELETE", `/seats/${first}`, 409);
  await api("DELETE", `/holds/${winner.id}`, 404, { token: otherToken });
  const publicAvailability = await api("GET", `${showPath}/availability`, 200);
  assert.deepEqual(publicAvailability.seats.map(({ status }) => status), ["held", "available", "available"]);
  assert.equal("held_by_user_id" in publicAvailability.seats[0], false);
  assert.equal("holdExpiresAt" in publicAvailability.seats[0], false);
  const ownAvailability = await api("GET", `${showPath}/availability`, 200, { token: buyerToken });
  assert.equal(ownAvailability.seats[0].heldByYou, true);

  await models.SeatHold.update({ expires_at: new Date(Date.now() - 1000) }, { where: { id: winner.id } });
  const stale = await api("GET", `/holds/${winner.id}`, 200, { token: buyerToken });
  assert.equal(stale.status, "expired");
  const replacement = await holdSeats([first, second], 201);
  const afterExpiry = await api("GET", `${showPath}/availability`, 200);
  assert.deepEqual(afterExpiry.seats.map(({ status }) => status), ["held", "held", "available"]);
  await expireStaleHolds();
  assert.equal((await models.SeatHold.findByPk(winner.id)).status, "expired");
  await api("DELETE", `/holds/${replacement.id}`, 204, { token: buyerToken });
  await api("DELETE", `/holds/${replacement.id}`, 204, { token: buyerToken });

  if (process.env.SEATSYNC_REDIS_TEST === "1") {
    const { connectRedis, disconnectRedis } = await import("../src/config/redis.js");
    const redis = await connectRedis();
    t.after(disconnectRedis);
    const cached = await holdSeats([second], 201);
    const key = `seatsync:hold:${cached.id}`;
    assert.equal(await redis.get(key), show.id);
    assert.ok((await redis.ttl(key)) > 0);
    await api("DELETE", `/holds/${cached.id}`, 204, { token: buyerToken });
    assert.equal(await redis.get(key), null);
  }

  const bookingRequest = (holdId, key, expected, token = buyerToken) =>
    api("POST", "/bookings", expected, {
      body: { holdId }, token, headers: { "Idempotency-Key": key },
    });
  await bookingRequest(winner.id, "expired-hold", 409);
  const heldForBooking = await holdSeats([first, second], 201);
  await bookingRequest(heldForBooking.id, "wrong-user", 404, otherToken);
  await api("POST", "/bookings", 422, { token: buyerToken, body: { holdId: heldForBooking.id } });
  await api("POST", "/bookings", 422, {
    token: buyerToken, headers: { "Idempotency-Key": "tampered-price" },
    body: { holdId: heldForBooking.id, total_minor: 1 },
  });

  const attempts = await Promise.all(Array.from({ length: 8 }, () =>
    fetch(`${api.origin}/api/v1/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyerToken}`,
        "Idempotency-Key": "booking-one",
      },
      body: JSON.stringify({ holdId: heldForBooking.id }),
    }).then(async (response) => ({ status: response.status, data: (await response.json()).data }))
  ));
  assert.equal(attempts.filter(({ status }) => status === 201).length, 1);
  assert.equal(attempts.filter(({ status }) => status === 200).length, 7);
  const booking = attempts[0].data;
  assert.equal(booking.status, "pending_payment");
  assert.equal(booking.total_minor, "39800");
  assert.equal(booking.currency, "INR");
  assert.ok(attempts.every(({ data }) => data.id === booking.id));
  assert.deepEqual(booking.items.map(({ unit_price_minor }) => unit_price_minor), ["19900", "19900"]);
  assert.equal("idempotency_key" in booking, false);
  await bookingRequest(heldForBooking.id, "different-key", 409);
  await bookingRequest(winner.id, "booking-one", 409);
  await api("GET", `/bookings/${booking.id}`, 404, { token: otherToken });
  await api("POST", `/bookings/${booking.id}/cancel`, 404, { token: otherToken });
  await api("DELETE", `/holds/${heldForBooking.id}`, 409, { token: buyerToken });
  await holdSeats([first], 409);
  await adminRequest("PATCH", `${showPath}/cancel`, 409);
  const pending = await api("GET", `${showPath}/availability`, 200);
  assert.deepEqual(pending.seats.map(({ status }) => status), ["held", "held", "available"]);

  await models.Booking.update({ expires_at: new Date(Date.now() - 1000) }, { where: { id: booking.id } });
  const expiredBooking = await bookingRequest(heldForBooking.id, "booking-one", 200);
  assert.equal(expiredBooking.status, "expired");
  const reclaim = await holdSeats([first], 201);
  const secondBooking = await bookingRequest(reclaim.id, "booking-two", 201);
  const { expireStaleBookings } = await import("../src/repositories/booking.repository.js");
  await expireStaleBookings();
  assert.equal((await models.Booking.findByPk(booking.id)).status, "expired");
  await api("POST", `/bookings/${booking.id}/cancel`, 409, { token: buyerToken });
  const cancelPath = `/bookings/${secondBooking.id}/cancel`;
  assert.equal((await api("POST", cancelPath, 200, { token: buyerToken })).status, "cancelled");
  await api("POST", cancelPath, 200, { token: buyerToken });
  const history = await api("GET", "/users/me/bookings?limit=1", 200, { token: buyerToken });
  assert.equal(history.pagination.total, 2);
  assert.deepEqual(history.bookings.map(({ id }) => id), [secondBooking.id]);
  assert.equal((await api("GET", "/users/me/bookings", 200, { token: otherToken })).pagination.total, 0);
  const afterCancel = await holdSeats([first], 201);
  await api("DELETE", `/holds/${afterCancel.id}`, 204, { token: buyerToken });

  await models.ShowSeatAllocation.create({ show_id: show.id, seat_id: third });
  await holdSeats([second, third], 409);
  const sold = await api("GET", `${showPath}/availability`, 200);
  assert.deepEqual(sold.seats.map(({ status }) => status), ["available", "available", "sold"]);
  await adminRequest("DELETE", `/venues/${venue.id}`, 409);
  await models.ShowSeatAllocation.destroy({ where: { show_id: show.id } });
  await adminRequest("DELETE", `/venues/${venue.id}`, 200);
  await api("GET", showPath, 404);
  assert.equal((await api("GET", "/shows", 200)).shows.length, 0);

  await api("POST", "/auth/logout", 200, { body: { refreshToken: rotated.refreshToken } });
  await api("GET", "/auth/me", 401, { token: rotated.accessToken });
  const invalidLogin = { email: "buyer@example.com", password: "wrong-password-22" };
  for (let attempt = 0; attempt < 7; attempt++) {
    await api("POST", "/auth/login", 401, { body: invalidLogin });
  }
  await api("POST", "/auth/login", 429, { body: invalidLogin });
});
