import Campaign from "../models/Campaign.js";
import Shop from "../models/Shop.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Initial seed campaign for Rupayan if none exists
async function ensureSeedCampaign() {
  try {
    const count = await Campaign.countDocuments();
    if (count === 0) {
      const rupayanShop = await Shop.findOne({ name: { $regex: /rupayan/i } });
      const rupayanUser = await User.findOne({ email: { $regex: /rupayan/i } });

      await Campaign.create({
        title: "website create",
        target: rupayanShop ? `Shop: ${rupayanShop.name}` : "Shop: RUPAYAN",
        targetArea: "সকল এলাকা",
        radius: "1 km",
        dailyBudget: 25,
        paidDays: 7,
        bonusDays: 7,
        days: 14,
        placements: ["3d_spotlight", "search_top", "feed_sponsored", "ads_clips"],
        placement: "ads_clips",
        placementLabel: "3D Spotlight + Search Top + Feed + Ads Clips",
        videoUrl: "/uploads/owners/179527447956789439.mp4",
        caption: "Professional website design and full-stack development service.",
        status: "active",
        impressions: 0,
        clicks: 0,
        likes: 0,
        shares: 0,
        spent: 0,
        shopName: rupayanShop?.name || "RUPAYAN",
        shopLogo: rupayanShop?.logo || "",
        verified: true,
        owner: rupayanUser?._id,
        shop: rupayanShop?._id,
      });
      console.log("Seeded initial active video campaign for Rupayan");
    }
  } catch (err) {
    console.error("Error ensuring seed campaign:", err);
  }
}

export const listCampaigns = asyncHandler(async (req, res) => {
  await ensureSeedCampaign();

  const filter = {};
  // If not requested from owner's private dashboard with ?all=true, return active campaigns
  if (req.query.all !== "true" && req.query.scope !== "all") {
    filter.status = "active";
  }

  const campaigns = await Campaign.find(filter)
    .populate("shop", "name logo verified")
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    campaigns: campaigns.map((c) => ({
      ...c,
      id: String(c._id),
      // Ensure verified flag is properly reflected from shop or default
      verified: c.shop?.verified !== undefined ? c.shop.verified : c.verified !== false,
      shopName: c.shop?.name || c.shopName || "Local Shop",
      shopLogo: c.shop?.logo || c.shopLogo || "",
    })),
  });
});

export const createCampaign = asyncHandler(async (req, res) => {
  const {
    title,
    target,
    targetArea = "সকল এলাকা",
    radius = "1 km",
    dailyBudget = 25,
    paidDays = 7,
    bonusDays = 0,
    days = 7,
    placements = ["ads_clips"],
    placementLabel = "Ads Clips",
    videoUrl = "",
    caption = "",
    shopId,
  } = req.body;

  if (!title || !target) {
    return res.status(400).json({ message: "Campaign title and target are required" });
  }

  let shopName = "Local Shop";
  let shopLogo = "";
  let isVerified = true;
  let targetShop = null;

  if (shopId) {
    targetShop = await Shop.findById(shopId);
  } else {
    // Try to find user's shop
    targetShop = await Shop.findOne({ owner: req.user?._id });
  }

  if (targetShop) {
    shopName = targetShop.name;
    shopLogo = targetShop.logo || "";
    isVerified = targetShop.verified;
  } else if (req.user) {
    shopName = req.user.name || "Local Shop";
    isVerified = req.user.isVerified || false;
  }

  const campaign = await Campaign.create({
    title,
    target,
    targetArea,
    radius,
    dailyBudget: Number(dailyBudget) || 25,
    paidDays: Number(paidDays) || 7,
    bonusDays: Number(bonusDays) || 0,
    days: Number(days) || (Number(paidDays) || 7) + (Number(bonusDays) || 0),
    placements: Array.isArray(placements) ? placements : [placements],
    placement: Array.isArray(placements) && placements[0] ? placements[0] : "ads_clips",
    placementLabel,
    videoUrl,
    caption,
    status: "active",
    impressions: 0,
    clicks: 0,
    likes: 0,
    shares: 0,
    spent: 0,
    shopName,
    shopLogo,
    verified: isVerified,
    owner: req.user?._id,
    shop: targetShop?._id,
  });

  res.status(201).json({
    campaign: {
      ...campaign.toObject(),
      id: String(campaign._id),
    },
  });
});

export const recordInteraction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'view' | 'like' | 'unlike' | 'share' | 'click'

  let update = {};
  if (action === "view") {
    update = { $inc: { impressions: 1 } };
  } else if (action === "like") {
    update = { $inc: { likes: 1 } };
  } else if (action === "unlike") {
    update = { $inc: { likes: -1 } };
  } else if (action === "share") {
    update = { $inc: { shares: 1 } };
  } else if (action === "click") {
    update = { $inc: { clicks: 1 } };
  } else {
    return res.status(400).json({ message: "Invalid action" });
  }

  const campaign = await Campaign.findByIdAndUpdate(id, update, { new: true });
  if (!campaign) {
    return res.status(404).json({ message: "Campaign not found" });
  }

  res.json({
    id: String(campaign._id),
    impressions: campaign.impressions,
    likes: campaign.likes,
    shares: campaign.shares,
    clicks: campaign.clicks,
  });
});

export const updateCampaign = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, name, caption, targetArea, dailyBudget } = req.body;
  const campaign = await Campaign.findById(id);
  if (!campaign) {
    return res.status(404).json({ message: "Campaign not found" });
  }

  if (title) campaign.title = title.trim();
  if (name) campaign.title = name.trim();
  if (caption !== undefined) campaign.caption = caption.trim();
  if (targetArea) campaign.targetArea = targetArea;
  if (dailyBudget) campaign.dailyBudget = Number(dailyBudget);

  await campaign.save();

  res.json({
    campaign: {
      ...campaign.toObject(),
      id: String(campaign._id),
      name: campaign.title,
    },
  });
});

export const updateCampaignStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const campaign = await Campaign.findById(id);
  if (!campaign) {
    return res.status(404).json({ message: "Campaign not found" });
  }

  campaign.status = campaign.status === "active" ? "paused" : "active";
  await campaign.save();

  res.json({ campaign: { ...campaign.toObject(), id: String(campaign._id) } });
});

export const deleteCampaign = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const campaign = await Campaign.findByIdAndDelete(id);
  if (!campaign) {
    return res.status(404).json({ message: "Campaign not found" });
  }

  res.json({ message: "Campaign deleted successfully", id });
});
