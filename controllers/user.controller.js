const Equip = require('../models/equip.model');
const User = require('../models/user.model');

const addUser = async (telegramId, username) => {
  try {
    const [user, created] = await User.findOrCreate({
      where: { telegram_id: telegramId },
      include: [{ model: Equip }],
      defaults: { username },
    });
    return user
  } catch (error) {
    console.error('Error afegint usuari:', error);
  }
};

const getUser = async (telegramId) => {
  try {
    const user = await User.findOne({
      where: { telegram_id: telegramId },
      include: [{ model: Equip }]
    });
    return user
  } catch (error) {
    console.error('Error cercant usuari:', error);
  }
};


module.exports = {
  addUser,
  getUser
};