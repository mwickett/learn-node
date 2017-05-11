const mongoose = require('mongoose')
const Store = mongoose.model('Store')

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

exports.createStore = async (req, res) => {
  const store = await (new Store(req.body)).save()
  req.flash('success', `Successfully created ${store.name}. Care to leave a review?`)
  res.redirect(`/store/${store.slug}`)
}

exports.getStore = async (req, res) => {
  // 1. Query db for stores
  const stores = await Store.find()
  res.render('stores', { title: 'Stores', stores })
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
  //find store and update
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // return new store instead of old one
    runValidators: true
  }).exec()
  // Redirect to store and tell them it worked
  req.flash('success', `Successfully updated ${store.name} <a href="/stores/${store.slug}">View store</a>`)
  res.redirect(`/stores/${store._id}/edit`)
}
