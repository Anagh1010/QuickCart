import connectDB from "@/config/db";
import Product from "@/models/Product";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET(_request, { params }) {
  const { id } = await params;

  if (!mongoose.isObjectIdOrHexString(id)) {
    return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
  }

  await connectDB();
  const product = await Product.findById(id).lean();

  if (!product) {
    return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, product });
}
