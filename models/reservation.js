'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Reservation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      models.User.belongsToMany(models.Dish, {through: Reservation})
      models.Dish.belongsToMany(models.User, {through: Reservation})

    }

    createCode() {
      this.code = this.date.toISOString().replace(/\D/g,'');
      
    }
    
  }
  Reservation.init({
    code: DataTypes.STRING,
    date: DataTypes.DATE,
    tableNumber: DataTypes.INTEGER,
    totalPrice: DataTypes.INTEGER,
    UserId: DataTypes.INTEGER,
    DishId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Reservation',
  });

  Reservation.addHook("beforeSave",(reservation)=>{
    reservation.code
  })
  return Reservation;
};