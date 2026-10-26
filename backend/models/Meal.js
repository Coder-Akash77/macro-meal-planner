
const mongoose = require("mongoose");

const nutritionSchema = new mongoose.Schema(
  {
    calories: { type: Number, default: 0, min: 0 },
    protein: { type: Number, default: 0, min: 0 },
    carbohydrates: { type: Number, default: 0, min: 0 },
    fat: { type: Number, default: 0, min: 0 },
    fiber: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const foodItemSchema = new mongoose.Schema(
  {
    foodId: {
      type: String,
      trim: true,
      default: "",
    },

    name: {
      type: String,
      required: [true, "Food name is required"],
      trim: true,
      maxlength: 200,
    },

    quantity: {
      type: Number,
      required: true,
      min: [0.01, "Quantity must be greater than zero"],
    },

    unit: {
      type: String,
      trim: true,
      default: "g",
      maxlength: 30,
    },

    nutrition: {
      type: nutritionSchema,
      default: () => ({}),
    },
  },
  { _id: true }
);

const mealSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: [true, "Meal name is required"],
      trim: true,
      maxlength: 120,
    },

    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "dinner", "snack"],
      default: "snack",
      lowercase: true,
    },

    foods: {
      type: [foodItemSchema],
      default: [],
    },

    nutrition: {
      type: nutritionSchema,
      default: () => ({}),
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

mealSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model("Meal", mealSchema);
