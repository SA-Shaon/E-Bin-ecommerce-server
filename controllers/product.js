import Product from "../medels/product.js";
import slugify from "slugify";
import fs from "fs";
import Order from "../medels/order.js";
import Stripe from "stripe";

export const create = async (req, res) => {
  try {
    // console.log(req.fields);
    // console.log(req.files);
    const { name, description, price, category, quantity, machine } =
      req.fields;
    const { photo } = req.files;

    console.log(req);

    //   validation
    switch (true) {
      case !name.trim():
        return res.json({ error: "Name is required" });
      case !description.trim():
        return res.json({ error: "Description is required" });
      case !price:
        return res.json({ error: "Price is required" });
      case !category:
        return res.json({ error: "category is required" });
      case !quantity:
        return res.json({ error: "Quantity is required" });
      case !machine:
        return res.json({ error: "Machine is required" });
      case photo && photo.size > 1000000:
        return res.json({ error: "Image should be less than 1mb in size" });
    }

    // create product
    const product = new Product({ ...req.fields, slug: slugify(name) });

    if (photo) {
      product.photo.data = fs.readFileSync(photo.path);
      product.photo.contentType = photo.type;
    }

    await product.save();
    res.json(product);
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err.message });
  }
};

export const list = async (req, res) => {
  try {
    // Here select used for (-) deselect photo and limit 12 for load only 12 data and sort createdAt is used for latest data first load
    const products = await Product.find({})
      .populate("category") // Load category data from db
      .select("-photo")
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err.message });
  }
};

export const read = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug })
      .select("-photo")
      .populate("category");
    res.json(product);
  } catch (err) {
    console.log(err);
    res.json({ error: err.message });
  }
};

export const photo = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId).select(
      "photo"
    );
    if (product.photo.data) {
      res.set("Content-Type", product.photo.contentType);
      return res.send(product.photo.data);
    }
  } catch (err) {
    console.log(err);
    res.json({ error: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const removed = await Product.findOneAndDelete(req.params.productId).select(
      "-photo"
    );
    console.log(removed);
    res.json(removed);
  } catch (err) {
    console.log(err);
    res.json({ error: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const { name, description, price, category, quantity, machine } =
      req.fields;
    const { photo } = req.files;

    //   validation
    switch (true) {
      case !name.trim():
        res.json({ error: "Name is required" });
      case !description.trim():
        res.json({ error: "Description is required" });
      case !price:
        res.json({ error: "Price is required" });
      case !category:
        res.json({ error: "category is required" });
      case !quantity:
        res.json({ error: "Quantity is required" });
      case !machine:
        res.json({ error: "Machine is required" });
      case photo && photo.size > 1000000:
        res.json({ error: "Image should be less than 1mb in size" });
    }

    // create product
    const product = await Product.findByIdAndUpdate(
      req.params.productId,
      {
        ...req.fields,
        slug: slugify(name),
      },
      { new: true }
    );

    if (photo) {
      product.photo.data = fs.readFileSync(photo.path);
      product.photo.contentType = photo.type;
    }

    await product.save(); // if we do not use save like category, photo does not change because photo uploaded here newly.
    res.json(product);
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err.message });
  }
};

export const filteredProducts = async (req, res) => {
  try {
    //
    const { checked, radio } = req.body;

    let args = {};
    if (checked.length) args.category = checked;
    if (radio.length) args.price = { $gte: radio[0], $lte: radio[1] };

    // console.log("args => ", args);
    // const products = await Product.find({
    //   category: ["dfgsdfgadsfga", "gffdksksdjfh"],
    //   price: { $gte: radio[0], $lte: radio[1] },
    // });
    const products = await Product.find(args)
      .select("-photo")
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.log(err);
  }
};

export const productsCount = async (req, res) => {
  try {
    const total = await Product.find({}).estimatedDocumentCount();
    res.json(total);
  } catch (err) {
    console.log(err);
  }
};

export const listProducts = async (req, res) => {
  try {
    const perPage = 8;
    const page = req.params.page ? req.params.page : 1;

    const products = await Product.find({})
      .select("-photo")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (err) {
    console.log(err);
  }
};

export const productsSearch = async (req, res) => {
  try {
    const { keyword } = req.params;
    const results = await Product.find({
      $or: [
        { name: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ],
    }).select("-photo");
    res.json(results);
  } catch (err) {
    console.log(err);
  }
};

export const relatedProducts = async (req, res) => {
  try {
    const { productId, categoryId } = req.params;
    const related = await Product.find({
      category: categoryId,
      _id: { $ne: productId },
    })
      .select("-photo")
      .populate("category")
      .limit(3);

    res.json(related);
  } catch (err) {
    console.log(err);
  }
};

export const newTransaction = async (req, res) => {
  try {
    const { cart, paymentIntent } = req.body;

    let productId = [...cart?.map((p) => p._id)];
    const payment = cart.reduce((prev, current) => {
      return prev + current.price;
    }, 0);
    const newOrder = new Order({
      products: productId,
      payment,
      paymentIntent: {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      },
      buyer: req.user._id,
    });
    await newOrder.save();
    // Decrement Quantity
    const bulkOps = cart.map((item) => {
      return {
        updateOne: {
          filter: { _id: item._id },
          update: { $inc: { quantity: -0, sold: +1 } },
        },
      };
    });
    Product.bulkWrite(bulkOps, {});
    res.json({ ok: true });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err.message });
  }
};

export const orderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(orderId, { status });
    res.json(order);
  } catch (err) {
    console.log(err);
  }
};

const stripe = new Stripe(
  "sk_test_51PXgipIdwBFMNmQQUcPWX9Xj7jgq6ZwK8wCqj0DauGo18KQJ9IlrFABVsx2WDsROX5qehPFtOT4PIYMJXLelV5NL00ryj3n3GJ"
);

// Stripe Integration
export const createConfirmIntent = async (req, res) => {
  try {
    const { price } = req.body;
    const amount = parseInt(price * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      payment_method_types: ["card"],
    });

    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.log(err);
  }
};
