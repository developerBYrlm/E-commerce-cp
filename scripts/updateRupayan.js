import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../server/config/db.js";
import User from "../server/models/User.js";
import Shop from "../server/models/Shop.js";

async function main() {
  await connectDatabase();
  const userRes = await User.updateMany(
    { email: { $regex: /rupayan/i } },
    { $set: { isVerified: true, role: "owner" } }
  );
  console.log("User update:", userRes);

  const shopRes = await Shop.updateMany(
    { name: { $regex: /rupayan/i } },
    { $set: { verified: true } }
  );
  console.log("Shop update:", shopRes);

  const updatedUser = await User.findOne({ email: { $regex: /rupayan/i } });
  const updatedShop = await Shop.findOne({ name: { $regex: /rupayan/i } });
  console.log("Updated Rupayan user isVerified:", updatedUser?.isVerified);
  console.log("Updated Rupayan shop verified:", updatedShop?.verified);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
