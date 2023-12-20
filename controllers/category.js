import Category from "../medels/category.js";
import slugify from "slugify";
import Product from "../medels/product.js";

export const create = async (req, res) => {
  try {
    const { name } = req.body;
    console.log(name);
    if (!name.trim()) {
      return res.json({ error: "Name is required." });
    }
    const existCategory = await Category.findOne({ name });
    if (existCategory) {
      return res.json({ error: "Category already exist." });
    }
    const category = await new Category({
      name: name,
      slug: slugify(name),
    }).save();
    res.json(category);
  } catch (err) {
    console.log(err);
  }
};

export const update = async (req, res) => {
  try {
    const { name } = req.body;
    const { categoryId } = req.params;
    const category = await Category.findOneAndUpdate(
      { _id: categoryId },
      {
        name,
        slug: slugify(name),
      },
      {
        new: true, // to send response updated one
      }
    );
    res.json(category);
  } catch (err) {
    console.log(err);
    return res.status(400).json(err.message);
  }
};
export const remove = async (req, res) => {
  try {
    const removed = await Category.findByIdAndDelete(req.params.categoryId);
    res.json(removed);
  } catch (err) {
    console.log(err);
    return res.status(400).json(err.message);
  }
};
export const list = async (req, res) => {
  try {
    const all = await Category.find({}).sort({ createdAt: -1 });
    res.json(all);
  } catch (err) {
    console.log(err);
    return res.status(400).json(err.message);
  }
};
export const read = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    res.json(category);
  } catch (err) {
    console.log(err);
    return res.status(400).json(err.message);
  }
};

export const productsByCategory = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    const products = await Product.find({ category }).populate("category");

    res.json({
      category,
      products,
    });
  } catch (err) {
    console.log(err);
    return res.status(400).json(err.message);
  }
};
