import mongoose, { Document, Schema } from 'mongoose';

export interface ISource extends Document {
  name: string;
  url: string;
  selectors: {
    article?: string;
    title: string;
    content: string;
    author?: string;
    publishedAt?: string;
    image?: string;
    summary?: string;
  };
  category?: string;
  requiresJavaScript: boolean;
  scrapingFrequency: number; // in minutes
  lastScraped?: Date;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SourceSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    selectors: {
      article: { type: String },
      title: { type: String, required: true },
      content: { type: String, required: true },
      author: { type: String },
      publishedAt: { type: String },
      image: { type: String },
      summary: { type: String },
    },
    category: {
      type: String,
      trim: true,
    },
    requiresJavaScript: {
      type: Boolean,
      default: false,
    },
    scrapingFrequency: {
      type: Number,
      default: 60, // Default to hourly scraping
    },
    lastScraped: {
      type: Date,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ISource>('Source', SourceSchema);
