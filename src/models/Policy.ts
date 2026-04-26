import mongoose, { type Document, type Model, Schema } from "mongoose"

export type PolicyType = "privacy" | "terms" | "refund" | "shipping"

export interface IPolicySection {
  heading: string
  description: string
}

export interface IPolicy extends Document {
  type: PolicyType
  title: string
  content: string
  sections: IPolicySection[]
  lastUpdated: Date
  createdAt: Date
  updatedAt: Date
}

const PolicySchema = new Schema<IPolicy>(
  {
    type: {
      type: String,
      required: true,
      enum: ["privacy", "terms", "refund", "shipping"],
      unique: true,
      index: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    sections: [
      {
        heading: {
          type: String,
          required: true,
          trim: true,
        },
        description: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

const Policy: Model<IPolicy> = mongoose.models.Policy || mongoose.model<IPolicy>("Policy", PolicySchema)

export default Policy
