import mongoose, { Document, Schema } from 'mongoose';

export interface IArticle extends Document {
  title: string;
  content: string;
  summary?: string;
  url: string;
  source: string;
  author?: string;
  publishedAt?: Date;
  imageUrl?: string;
  category?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ArticleSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    source: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      trim: true,
    },
    publishedAt: {
      type: Date,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    tags: {
      type: [String],
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index for deduplication and searching
ArticleSchema.index({ url: 1, source: 1 }, { unique: true });
ArticleSchema.index({ title: 'text', content: 'text' });
ArticleSchema.index({ publishedAt: -1 });
ArticleSchema.index({ category: 1, publishedAt: -1 });
ArticleSchema.index({ source: 1, publishedAt: -1 });

export default mongoose.model<IArticle>('Article', ArticleSchema);
