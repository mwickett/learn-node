const mongoose = require('mongoose')
mongoose.Promise = global.Promise
const slug = require('slugs')

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'Please enter a store name'
  },
  slug: String,
  description: {
    type: String,
    trim: true
  },
  tags: [String],
  created: {
    type: Date,
    default: Date.now
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: [{
      type: Number,
      required: 'You must supply coordinates'
    }],
    address: {
      type: String,
      required: 'You must supply an address'
    }
  },
  photo: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an author'
  }
}, {
  // Populate virtual fields by default
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Define indexes
storeSchema.index({
  name: 'text',
  description: 'text'
})

storeSchema.index({
  location: '2dsphere'
})

storeSchema.pre('save', async function (next) {
  if (!this.isModified('name')) {
    next()
    return
  }
  this.slug = slug(this.name)
  //Find other stores that have same slug
  const slugRegex = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i')
  const storesWithSlug = await this.constructor.find({ slug: slugRegex })
  if (storesWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`
  }
  next()
  // Todo make slugs more resilient
})

storeSchema.statics.getTagsList = function () {
  return this.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ])
}

storeSchema.statics.getTopStores = function () {
  return this.aggregate([
    // Lookup stores and populate their reviews
    { $lookup: { from: 'reviews', localField: '_id', foreignField: 'store', as: 'reviews' } },
    // Filter for items that 2 or more reviews
    { $match: { 'reviews.1': { $exists: true } } },
    // Add the average reviews field
    { $project: {
      // This is because of MongoDB 3.2
      photo: '$$ROOT.photo',
      name: '$$ROOT.name',
      reviews: '$$ROOT.reviews',
      slug: '$$ROOT.slug',
      averageRating: { $avg: '$reviews.rating' }
    }},
    // Sort it by our new field, highest first
    { $sort: {averageRating: -1 }},
    // Limit it to 10
    { $limit: 10 }
  ])
}


// Find reviews where the stores _id prop === reviews store property
// NOTE: By default, virutal fields don't show unless they are called - see they've been added to the schema above
storeSchema.virtual('reviews', {
  ref: 'Review', // What model to link?
  localField: '_id', // Which field on the store?
  foreignField: 'store' // Which field on the review?
})

module.exports = mongoose.model('Store', storeSchema)
