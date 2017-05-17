const mongoose = require('mongoose')
const Store = mongoose.model('Store')
const multer = require('multer')
const jimp = require('jimp')
const uuid = require('uuid')
const User = mongoose.model('User')

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter (req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/')
    if (isPhoto) {
      next(null, true)
    } else {
      next({ message: `That fileype isn't allowed` }, false)
    }
  }
}

exports.homePage = (req, res) => {
  req.flash('error', 'Something happened')
  req.flash('success', 'Something happened')
  req.flash('warning', 'Something happened')
  req.flash('info', 'Something happened')
  res.render('index')
}

exports.addStore = (req, res) => {
  res.render('editStore', { title: 'Add Store' })
}

exports.upload = multer(multerOptions).single('photo')

exports.resize = async (req, res, next) => {
  // Check if there is a new file
  if (!req.file) {
    next() // Move along
    return
  }
  const extension = req.file.mimetype.split('/')[1]
  req.body.photo = `${uuid.v4()}.${extension}`
  const photo = await jimp.read(req.file.buffer)
  await photo.resize(800, jimp.AUTO)
  await photo.write(`./public/uploads/${req.body.photo}`)
  next()
}

exports.createStore = async (req, res) => {
  req.body.author = req.user._id // Get the id of the currently logged in user and assign it to author
  const store = await (new Store(req.body)).save()
  req.flash('success', `Successfully created ${store.name}. Care to leave a review?`)
  res.redirect(`/store/${store.slug}`)
}

exports.getStores = async (req, res) => {
  const page = req.params.page || 1
  const limit = 4
  const skip = (page * limit) - limit
  // 1. Query db for stores
  const stores = await Store
    .find()
    .skip(skip)
    .limit(limit)
  res.render('stores', { title: 'Stores', stores })
}

exports.getStoreBySlug = async (req, res, next) => {
  // Query the db
  const store = await Store.findOne({ slug: req.params.slug }).populate('author reviews')
  if (!store) return next()
  res.render('store', { title: store.name, store })
}

const confirmOwner = (store, user) => {
  if (!store.author.equals(user._id)) {
    throw Error('You must own a store to edit it')
  }
}

exports.editStore = async (req, res) => {
  // 1. Find the store given id
  const store = await Store.findOne({ _id: req.params.id })
  // 2. Make sure they are the owner
  confirmOwner(store, req.user)
  // 3. Render out the edit form so the user can update their store
  res.render('editStore', { title: `Edit ${store.name}`, store })
}

exports.updateStore = async (req, res) => {
  req.body.location.type = 'Point'
  //find store and update
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // return new store instead of old one
    runValidators: true
  }).exec()
  // Redirect to store and tell them it worked
  req.flash('success', `Successfully updated ${store.name} <a href="/stores/${store.slug}">View store</a>`)
  res.redirect(`/stores/${store._id}/edit`)
}

exports.getStoresByTag = async(req, res) => {
  const tag = req.params.tag
  const tagQuery = tag || { $exists: true }
  // Fire off both the tags and the stores at the same time as promises
  const tagsPromise = Store.getTagsList()
  const storesPromise = Store.find({ tags: tagQuery })
  // Await both promises at the same time
  const [tags, stores] = await Promise.all([tagsPromise, storesPromise])
  res.render('tags', { tags, stores, title: 'Tags', tag })
}

exports.searchStores = async (req, res) => {
  const stores = await Store.find({
    $text: {
      $search: req.query.q
    }
  }, {
    score: { $meta: 'textScore' }
  })
  .sort({
    score: { $meta: 'textScore' }
  })
  .limit(5)
  res.json(stores)
}

exports.mapStores = async(req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat)
  const q = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates
        }, 
        $maxDistance: 10000 // 10km
      }
    }

  }
  const stores = await Store.find(q).select('slug name description location').limit(10)
  res.json(stores)
}

exports.mapPage = (req, res) => {
  res.render('map', { title: 'Map' })
}

exports.heartStore = async (req, res) => {
  const hearts = req.user.hearts.map(obj => obj.toString())
  // Create var that checks if the current store is already in the hearts array for the user
  const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet'
  const user = await User
    .findByIdAndUpdate(req.user._id,
    { [operator]: { hearts: req.params.id } },
    { new: true }
  )
  res.json(user)
}

exports.hearts = async (req, res) => {
  const hearts = req.user.hearts
  const stores = await Store.find({
    _id: { $in: hearts }
  })
  res.render('stores', { title: 'Stores you like', stores })
}

exports.getTopStores = async (req, res) => {
  const stores = await Store.getTopStores()
  res.render('topStores', { stores, title: 'Top Stores!' })
}
