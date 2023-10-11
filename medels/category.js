import mongoose from "mongoose";
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      maxLength: 32,
      uniqure: true,
    },
    slug: {
      type: String,
      uniqure: true,
      lowercase: true,
    },
  },
  { timestamps: true }
);
const Category = mongoose.model("Category", categorySchema, "Categories");
export default Category;
