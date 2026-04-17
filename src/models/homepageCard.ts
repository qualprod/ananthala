import mongoose from "mongoose"

const HomepageCardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a card name"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    tagline: {
      type: String,
      trim: true,
      maxlength: [120, "Tagline cannot exceed 120 characters"],
      default: "",
    },
    backgroundUrl: {
      type: String,
      required: [true, "Please provide a background URL"],
    },
    position: {
      type: String,
      enum: ["center", "bottom-right", "bottom-left"],
      default: "center",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
)

export const HomepageCard = mongoose.models?.HomepageCard || mongoose.model("HomepageCard", HomepageCardSchema)
