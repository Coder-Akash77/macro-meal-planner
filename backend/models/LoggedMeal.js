const mongoose = require("mongoose");

const loggedMealItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 200 },
  quantity: { type: Number, required: true, min: 0.01 },
}, { _id: false });

const loggedMealSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  items: { type: [loggedMealItemSchema], required: true, validate: v => v.length > 0 },
  totalCalories: { type: Number, default: 0, min: 0 },
  totalProtein: { type: Number, default: 0, min: 0 },
  totalCarbs: { type: Number, default: 0, min: 0 },
  totalFat: { type: Number, default: 0, min: 0 },
  totalFiber: { type: Number, default: 0, min: 0 },
  loggedDate: { type: Date, required: true, index: true, default: Date.now },
}, { timestamps: true, versionKey: false });

loggedMealSchema.index({ user: 1, loggedDate: -1 });
module.exports = mongoose.model("LoggedMeal", loggedMealSchema);
