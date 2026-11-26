import "dotenv/config";
import sequelize from "../config/database.js";
import { User } from "../models/index.js";

const email = process.argv[2]?.trim().toLowerCase();

try {
  if (!email) throw new Error("Usage: npm run admin:promote -- user@example.com");
  const [updated] = await User.update({ role: "admin" }, { where: { email, is_active: true } });
  if (updated !== 1) throw new Error("No matching active account");
  console.log("Active account granted the admin role");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
