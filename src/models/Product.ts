import mongoose, { Schema, models } from "mongoose"

export interface IProductVariant {
  variantId: string
  weight: number // in kg
  length: number // in inch
  width: number // in inch
  height: number // in inch
  fabric: string // fabric type/id
  price: number
  stock: number
  imageUrls: string[]
}

export interface IColorOption {
  fabric: string
  imageUrls: string[]
}

export interface IProductDetailSection {
  title: string
  body: string
  imageUrl?: string
  imageAlt?: string
  imagePosition?: "left" | "right"
}

export interface IHamperItem {
  name: string
  imageUrls: string[]
  variants: IHamperItemVariant[]
}

export interface IHamperItemVariant {
  weight: number
  length: number
  width: number
  height: number
  fabric: string
  stock: number
  imageUrls: string[]
}

export interface IProduct {
  productType: "single" | "hamper"
  productTitle: string
  description: string
  units: string
  sellerName: string
  sellerEmail: string
  location: string
  category: string
  subCategory: string
  primaryImage?: string
  imageUrls: string[] // Array of Vercel Blob URLs
  variants: IProductVariant[]
  colorOptions?: IColorOption[]
  detailSections?: IProductDetailSection[]
  hamperItems?: IHamperItem[]
  hamperPrice?: number
  hamperFabric?: string
  hamperFabricOptions?: string[]
  productRole?: "normal" | "complementary" // Type of product: normal or can be offered as free
  complementaryProductIds?: string[] // MongoDB IDs of free products
  displayOrder?: number
  status: "visible" | "hidden"
  createdAt: Date
  updatedAt: Date
}

const getProductTypeForValidation = (context: any): "single" | "hamper" | undefined => {
  if (!context) return undefined
  if (typeof context.productType === "string") return context.productType
  if (typeof context.getUpdate !== "function") return undefined
  const update = context.getUpdate() || {}
  if (typeof update.productType === "string") return update.productType
  if (update.$set && typeof update.$set.productType === "string") return update.$set.productType
  return undefined
}

const ProductVariantSchema = new Schema<IProductVariant>(
  {
    variantId: {
      type: String,
      required: true,
    },
    weight: {
      type: Number,
      required: [true, "Weight is required"],
      min: [0, "Weight must be positive"],
    },
    length: {
      type: Number,
      required: [true, "Length is required"],
      min: [0, "Length must be positive"],
    },
    width: {
      type: Number,
      required: [true, "Width is required"],
      min: [0, "Width must be positive"],
    },
    height: {
      type: Number,
      required: [true, "Height is required"],
      min: [0, "Height must be positive"],
    },
    fabric: {
      type: String,
      required: [true, "Fabric is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price must be positive"],
    },
    stock: {
      type: Number,
      required: [true, "Stock is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    imageUrls: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length <= 6,
        message: "Each variant can have up to 6 images",
      },
    },
  },
  { _id: false },
)

const ColorOptionSchema = new Schema<IColorOption>(
  {
    fabric: {
      type: String,
      required: [true, "Fabric is required for color options"],
      trim: true,
    },
    imageUrls: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length > 0 && v.length <= 6,
        message: "Each color option must have between 1 and 6 images",
      },
    },
  },
  { _id: false },
)

const ProductDetailSectionSchema = new Schema<IProductDetailSection>(
  {
    title: {
      type: String,
      trim: true,
      maxlength: [200, "Section title cannot exceed 200 characters"],
    },
    body: {
      type: String,
      trim: true,
      maxlength: [3000, "Section body cannot exceed 3000 characters"],
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    imageAlt: {
      type: String,
      trim: true,
      maxlength: [200, "Image alt text cannot exceed 200 characters"],
    },
    imagePosition: {
      type: String,
      enum: ["left", "right"],
    },
  },
  { _id: false },
)

const HamperItemSchema = new Schema<IHamperItem>(
  {
    name: {
      type: String,
      required: [true, "Hamper item name is required"],
      trim: true,
      maxlength: [200, "Hamper item name cannot exceed 200 characters"],
    },
    imageUrls: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length <= 6,
        message: "Hamper items can have up to 6 images",
      },
    },
    variants: {
      type: [
        new Schema<IHamperItemVariant>(
          {
            weight: {
              type: Number,
              required: [true, "Hamper item variant weight is required"],
              min: [0, "Weight must be positive"],
            },
            length: {
              type: Number,
              required: [true, "Hamper item variant length is required"],
              min: [0, "Length must be positive"],
            },
            width: {
              type: Number,
              required: [true, "Hamper item variant width is required"],
              min: [0, "Width must be positive"],
            },
            height: {
              type: Number,
              required: [true, "Hamper item variant height is required"],
              min: [0, "Height must be positive"],
            },
            fabric: {
              type: String,
              required: [true, "Hamper item variant fabric is required"],
              trim: true,
            },
            stock: {
              type: Number,
              required: [true, "Hamper item variant stock is required"],
              min: [0, "Hamper item variant stock must be positive"],
              default: 0,
            },
            imageUrls: {
              type: [String],
              default: [],
              validate: {
                validator: (v: string[]) => Array.isArray(v) && v.length > 0 && v.length <= 6,
                message: "Hamper item variant images must be between 1 and 6",
              },
            },
          },
          { _id: false },
        ),
      ],
      required: [true, "Hamper item variants are required"],
      validate: {
        validator: (v: IHamperItemVariant[]) => Array.isArray(v) && v.length > 0,
        message: "At least one hamper item variant is required",
      },
    },
  },
  { _id: false },
)

const ProductSchema = new Schema<IProduct>(
  {
    productType: {
      type: String,
      enum: {
        values: ["single", "hamper"],
        message: "{VALUE} is not a valid product type",
      },
      default: "single",
    },
    productTitle: {
      type: String,
      required: [true, "Product title is required"],
      trim: true,
      maxlength: [200, "Product title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    units: {
      type: String,
      required: [true, "Units are required"],
      trim: true,
    },
    sellerName: {
      type: String,
      required: [true, "Seller name is required"],
      trim: true,
    },
    sellerEmail: {
      type: String,
      required: [true, "Seller email is required"],
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid seller email"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: ["joy","bliss","grace", "mattress", "pillow", "bedding", "bedsheet"],
        message: "Category must be either joy,bliss,grace ,mattress, pillow, bedding, or bedsheet",
      },
      trim: true,
    },
    subCategory: {
      type: String,
      required: false,
      trim: true,
    },
    primaryImage: {
      type: String,
      trim: true,
      default: "",
    },
    imageUrls: {
      type: [String],
      default: [],
      validate: {
        validator: function (this: any, v: string[]) {
          const productType = getProductTypeForValidation(this)
          if (productType === "hamper") {
            return Array.isArray(v) && v.length <= 6
          }
          return Array.isArray(v) && v.length > 0 && v.length <= 6
        },
        message: "Must have between 1 and 6 product images",
      },
    },
    variants: {
      type: [ProductVariantSchema],
      default: [],
      validate: {
        validator: function (this: any, v: IProductVariant[]) {
          const productType = getProductTypeForValidation(this)
          if (productType === "hamper") return true
          return Array.isArray(v) && v.length > 0
        },
        message: "At least one product variant is required",
      },
    },
    colorOptions: {
      type: [ColorOptionSchema],
      default: [],
      validate: {
        validator: function (this: any, v: IColorOption[]) {
          const productType = getProductTypeForValidation(this)
          if (productType === "hamper") return true
          return Array.isArray(v) && v.length > 0
        },
        message: "At least one color option is required",
      },
    },
    detailSections: {
      type: [ProductDetailSectionSchema],
      default: [],
    },
    hamperItems: {
      type: [HamperItemSchema],
      default: [],
      validate: {
        validator: function (this: any, v: IHamperItem[]) {
          const productType = getProductTypeForValidation(this)
          if (productType !== "hamper") return true
          return Array.isArray(v) && v.length > 0
        },
        message: "At least one hamper item is required for hamper products",
      },
    },
    hamperPrice: {
      type: Number,
      min: [0, "Hamper price must be positive"],
      validate: {
        validator: function (this: any, v: number) {
          const productType = getProductTypeForValidation(this)
          if (productType !== "hamper") return true
          return typeof v === "number" && Number.isFinite(v) && v > 0
        },
        message: "Hamper price is required for hamper products",
      },
    },
    hamperFabric: {
      type: String,
      trim: true,
      validate: {
        validator: function (this: any, v: string) {
          const productType = getProductTypeForValidation(this)
          if (productType !== "hamper") return true
          const options =
            Array.isArray(this?.hamperFabricOptions) && this.hamperFabricOptions.length > 0
              ? this.hamperFabricOptions
              : Array.isArray(this?.getUpdate?.()?.$set?.hamperFabricOptions)
                ? this.getUpdate().$set.hamperFabricOptions
                : Array.isArray(this?.getUpdate?.()?.hamperFabricOptions)
                  ? this.getUpdate().hamperFabricOptions
                  : []
          return (typeof v === "string" && v.trim().length > 0) || options.length > 0
        },
        message: "At least one hamper fabric option is required for hamper products",
      },
    },
    hamperFabricOptions: {
      type: [String],
      default: [],
      validate: {
        validator: function (this: any, v: string[]) {
          const productType = getProductTypeForValidation(this)
          if (productType !== "hamper") return true
          return Array.isArray(v) && v.length > 0 && v.every((option) => typeof option === "string" && !!option.trim())
        },
        message: "At least one hamper fabric option is required for hamper products",
      },
    },
    productRole: {
      type: String,
      enum: {
        values: ["normal", "complementary"],
        message: "{VALUE} is not a valid product role",
      },
      default: "normal",
      description: "Type of product: normal (purchasable) or complementary (can be offered as free)",
    },
    complementaryProductIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Product",
      default: [],
      description: "Array of product IDs that are given free with this product",
    },
    displayOrder: {
      type: Number,
      default: null,
      description: "Controls display ordering on category pages",
    },
    status: {
      type: String,
      enum: {
        values: ["visible", "hidden"],
        message: "{VALUE} is not a valid status",
      },
      default: "visible",
    },
  },
  {
    timestamps: true,
  },
)

// Index for efficient queries
ProductSchema.index({ sellerEmail: 1, createdAt: -1 })
ProductSchema.index({ category: 1, status: 1 })
ProductSchema.index({ status: 1 })

// Clean up existing model if it exists
if (models.Product) {
  delete models.Product
}

const Product = mongoose.model<IProduct>("Product", ProductSchema)

export default Product
