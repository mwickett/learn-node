const mongoose = require('mongoose')
const Store = mongoose.model('Store')
const multer = require('multer')
const jimp = require('jimp')
const uuid = require('uuid')

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
  const store = await (new Store(req.body)).save()
  req.flash('success', `Successfully created ${store.name}. Care to leave a review?`)
  res.redirect(`/store/${store.slug}`)
}

exports.getStores = async (req, res) => {
  // 1. Query db for stores
  const stores = await Store.find()
  res.render('stores', { title: 'Stores', stores })
}

exports.getStoreBySlug = async (req, res, next) => {
  // Query the db
  const store = await Store.findOne({ slug: req.params.slug })
  if (!store) return next()
  res.render('store', { title: store.name, store })
}

exports.editStore = async (req, res) => {
  // 1. Find the store given id
  const store = await Store.findOne({ _id: req.params.id })
  res.render('editStore', { title: `Edit ${store.name}`, store })
  // 2. Make sure they are the owner
  // TODO
  // 3. Render out the edit form so the user can update their store
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
  const tags = await Store.getTagsList()
  const tag = req.params.tag
  res.render('tags', { tags, title: 'Tags', tag })
}
