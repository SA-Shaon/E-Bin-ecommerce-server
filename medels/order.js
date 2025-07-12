import mongoose from "mongoose";
const { Schema } = mongoose;
const orderSchema = new Schema(
  {
    products: [{ type: Schema.ObjectId, ref: "Product" }],
    payment: { type: Number, default: 0 },
    buyer: { type: Schema.ObjectId, ref: "User" },
    paymentIntent: {
      id: String,
      amount: Number,
      currency: String,
      status: String,
    },
    status: {
      type: String,
      default: "Not processed",
      enum: [
        "Not processed",
        "Processing",
        "Shipped",
        "Devlivered",
        "Cancelled",
      ],
    },
  },
  { timestamps: true }
);
const Order = mongoose.model("Order", orderSchema, "Orders");
export default Order;
