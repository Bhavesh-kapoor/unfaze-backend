import mongoose, { Schema } from "mongoose";
import slugify from "slugify";

const BlogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
      default: "",
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
    },
    short_description: {
      trim: true,
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

BlogSchema.pre("save", function (next) {
  if (this.isNew) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

const Blog = mongoose.model("Blog", BlogSchema);

export default Blog;
