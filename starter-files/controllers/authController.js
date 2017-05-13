const passport = require('passport')
const crypto = require('crypto')
const mongoose = require('mongoose')
const User = mongoose.model('User')

exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Failed Login!',
  successRedirect: '/',
  successFlash: 'Logged in'
})

exports.logout = (req, res) => {
  req.logout()
  req.flash('success', 'You are now logged out')
  res.redirect('/')
}

exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next()
    return
  }
  req.flash('error', 'You must be logged in')
  res.redirect('/login')
}

exports.forgot = async (req, res) => {
  // 1. see if user exists
  const user = await User.findOne({ email: req.body.email })
  if (!user) {
    req.flash('error', 'Nope!')
    return res.redirect('/login')
  }
  // 2. Set reset tokens and expiry on their account
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex')
  user.resetPasswordExpires = Date.now() + 3600000 // 1 hour from now
  await user.save()
  // 3. Send them an email
  const resetUrl = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`
  req.flash('success', `You have been emailed a password reset link. ${resetUrl}`)
  // 4. Redirect to login
  res.redirect('/login')
}

exports.reset = async (req, res) => {
  // Check if there is someone with the token
  const user = await User.findOne({ 
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  })
  if (!user) {
    req.flash('failure', `This token doesn't exist`)
    return res.redirect('/login')
  }
  // Check to make sure the time hasn't passed
}
