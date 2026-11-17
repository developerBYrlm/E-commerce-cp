import Category from "../models/Category.js";
import { SHOP_CATEGORIES } from "../../shared/catalogOptions.js";

const slugify = (value) => value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function seedShopCategories() {
  await Category.bulkWrite(SHOP_CATEGORIES.map((name) => ({
    updateOne: {
      filter: { name },
      update: { $setOnInsert: { name, slug: slugify(name), type: "all" } },
      upsert: true,
    },
  })), { ordered: false });
}
