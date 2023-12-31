"use strict";
const formatCurrency = require('../helpers/formatCurrency')
const formatDate = require('../helpers/formatDate')
const { User, Profile, Dish, Reservation } = require('../models/index')
const bcrpyt = require('bcryptjs')

class Controller {
  static home(req, res) {
    const role = req.session.role
    Dish.findAll()
      .then((dishes) => {
        res.render('Home', { dishes, role })
      })
      .catch((err) => {
        console.log(err);
        res.send(err);
      })
  }
  static register(req, res) {
    const error = req.query.error ? req.query.error.split('-').join(', ') : null;
    res.render("Register", { error })
  }
  static createUser(req, res) {
    User.create(req.body)
      .then((data) => {
        const { id } = data
        req.session.userId = id
        req.session.role = data.role;
        return Profile.create({
          fullName: "",
          gender: "",
          UserId: id,
        })
      })
      .then(() => {
        res.redirect('/')
      })
      .catch((err) => {
        console.log(err);
        if (err.name === 'SequelizeValidationError' ||
          err.name === "SequelizeUniqueConstraintError") {
          const error = err.errors.map((el) => el.message).join('-');
          return res.redirect(`/register?error=${error}`)
        }
        res.send(err);
      })
  }

  static login(req, res) {
    const { error } = req.query;
    res.render("Login", { error });
  }

  static postLogin(req, res) {
    const { username, password } = req.body
    if (!username) {
      let error = `Username is required`;
      return res.redirect(`/login?error=${error}`)
    }
    if (!password) {
      let error = `Password is required`;
      return res.redirect(`/login?error=${error}`)
    }
    User.findOne({
      where: {
        username: username
      }
    })
      .then((user) => {
        const isCorrectPassword = bcrpyt.compareSync(password, user.password)
        if (isCorrectPassword) {
          req.session.userId = user.id;//set userId ke session 
          req.session.role = user.role;//set role ke session
          return res.redirect('/')
        } else {
          let error = 'Invalid username/password'
          return res.redirect(`/login?error=${error}`)
        }
      })
      .catch((err) => {
        console.log(err);
        res.send(err);
      })

  }

  static dishes(req, res) {
    Dish.findAll()
      .then((dataDish) => {
        res.render("Dishes", { dataDish, formatCurrency })
      })
      .catch((err) => {
        console.log(err);
        res.send(err);
      })
  }

  static logout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        console.log(err);
        res.send(err)
      } else res.redirect('/')
    })
  }


  static reservation(req, res) {
    const msg = req.query.msg ? req.query.msg.split('-').join(' ') : null; // logika untuk mengolah message ke tampilan nanti
    const role = req.session.role // role untuk navbar dinamis
    Dish.findAll()
      .then((dataDish) => {
        res.render("Reservation", { dataDish, msg, role })
      })
      .catch((err) => {
        console.log(err);
        res.send(err);
      })
  }

  static postReservation(req, res) {
    const { date, tableNumber, DishId } = req.body
    const UserId = req.session.userId
    let totalPrice
    Dish.findOne({
      where: {
        id: DishId
      }
    })
      .then((data) => {
        totalPrice = data.price;
        console.log(date, tableNumber, DishId, totalPrice)
        return Reservation.create({
          date, tableNumber, totalPrice, DishId, UserId
        })
      })
      .then(() => {
        res.redirect('/reservation?msg=Reservation-Added')
      })
      .catch((err) => {
        console.log(err);
        res.send(err);
      })

  }

  static cancelReservation(req, res) {
    const UserId = req.session.userId
    const role = req.session.role
    Reservation.findAll({ where: { UserId: UserId } })
      .then((data) => {
        res.render('CancelReservation', {
          data, formatCurrency, role, formatDate
        })
      })
      .catch((err) => {
        console.log(err);
        res.send(err);
      })

  }
  static dataReservation(req, res) {
    const role = req.session.role
    Reservation.findAll({
      include: [
        {
          model: User
        },
        {
          model: Dish
        }
      ]
    })
      .then((data) => {
        console.log(data)
        res.render('SecretReservation', { data, formatCurrency, role, formatDate })
      })
      .catch((err) => {
        console.log(err);
        res.send(err);
      })
  }

  static editProfile(req, res) {
    const UserId = req.session.userId
    Profile.findOne({
      where: {
        UserId: UserId
      }
    })
      .then((data) => {
        res.render('EditProfile', { data })
      })
      .catch((err) => {
        console.log(err);
        res.send(err);
      })
  }

  static saveProfile(req, res) {
    const UserId = req.session.userId
    const { fullName, gender } = req.body
    Profile.update({ fullName, gender, UserId }, {
      where: { UserId: UserId }
    })
      .then(() => {
        res.redirect('/')
      })
      .catch((err) => {
        console.log(err);
        res.send(err);
      })
  }

  static deleteReservation(req, res) {
    const code = req.params.code
    Reservation.destroy({
      where: {
        code: code
      }
    })
      .then(() => {
        if (req.session.role == 'admin') {
          res.redirect('/secretreservation')
        } else res.redirect('/cancelreservation')
      })
      .catch((err) => {
        console.log(err);
        res.send(err);
      })
  }
}

module.exports = Controller