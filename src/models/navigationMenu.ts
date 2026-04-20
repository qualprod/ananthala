import mongoose from "mongoose"

const NavigationMenuSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: [true, "Please provide a menu label"],
      trim: true,
      maxlength: [100, "Label cannot exceed 100 characters"],
    },
    href: {
      type: String,
      required: [true, "Please provide a menu link"],
      trim: true,
      maxlength: [300, "Link cannot exceed 300 characters"],
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

export const NavigationMenu =
  mongoose.models?.NavigationMenu || mongoose.model("NavigationMenu", NavigationMenuSchema)
