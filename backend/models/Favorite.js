const mongoose = require("mongoose");

const favoriteItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 200 },
  quantity: { type: Number, required: true, min: 0.01 },
}, { _id: false });

const favoriteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  items: { type: [favoriteItemSchema], required: true, validate: v => v.length > 0 },
  totalCalories: { type: Number, default: 0, min: 0 },
  totalProtein: { type: Number, default: 0, min: 0 },
  totalCarbs: { type: Number, default: 0, min: 0 },
  totalFat: { type: Number, default: 0, min: 0 },
  totalFiber: { type: Number, default: 0, min: 0 },
}, { timestamps: true, versionKey: false });

favoriteSchema.index({ user: 1, createdAt: -1 });
module.exports = mongoose.model("Favorite", favoriteSchema);
