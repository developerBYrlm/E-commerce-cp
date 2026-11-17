import Post from "../models/Post.js";
import Shop from "../models/Shop.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createPost = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ _id: req.body.shop, owner: req.user.id, status: "active" });
  if (!shop) return res.status(403).json({ message: "Create posts for an active shop you own" });
  const post = await Post.create({ ...req.body, shop: shop.id, author: req.user.id });
  res.status(201).json({ item: post });
});

export const feed = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(30, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
  const followed = req.user?.following || [];
  const filter = req.query.following === "true" ? { shop: { $in: followed } } : {};
  const [items, total] = await Promise.all([
    Post.find(filter).populate("shop", "name slug logo verified").populate("author", "name avatar").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Post.countDocuments(filter),
  ]);
  res.json({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const togglePostInteraction = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });
  const field = req.params.action === "like" ? "likes" : "saves";
  const has = post[field].some((id) => id.equals(req.user._id));
  if (has) post[field].pull(req.user._id);
  else post[field].addToSet(req.user._id);
  await post.save();
  res.json({ active: !has, count: post[field].length });
});

export const addComment = asyncHandler(async (req, res) => {
  const post = await Post.findByIdAndUpdate(req.params.id, { $push: { comments: { author: req.user.id, text: req.body.text } } }, { new: true, runValidators: true });
  if (!post) return res.status(404).json({ message: "Post not found" });
  res.status(201).json({ comments: post.comments });
});
