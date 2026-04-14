import mongoose, { Schema, models } from "mongoose"

export interface IFabric {
  _id?: string
  name: string
  id: string
  image?: string
  pattern?: string
  createdAt?: Date
  updatedAt?: Date
}

const FabricSchema = new Schema<IFabric>(
  {
    name: {
      type: String,
      required: [true, "Fabric name is required"],
      trim: true,
      maxlength: [100, "Fabric name cannot exceed 100 characters"],
      unique: true,
    },
    id: {
      type: String,
      required: [true, "Fabric ID is required"],
      trim: true,
      maxlength: [100, "Fabric ID cannot exceed 100 characters"],
      unique: true,
    },
    image: {
      type: String,
      trim: true,
    },
    pattern: {
      type: String,
      default: "pattern-solid",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

// Prevent re-creation of model
if (models.Fabric) {
  delete models.Fabric
}

const Fabric = mongoose.model<IFabric>("Fabric", FabricSchema)

export default Fabric
