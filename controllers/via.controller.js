const Agulla = require('../models/agulla.model');
const Via = require('../models/via.model');

const getVia = async (id) => {
    try {
      const via = await Via.findOne({
        where: { id: id, visible: 1 },
        include: [{ model: Agulla }]
      });
      return via
    } catch (error) {
      console.error('Error trobant vies:', error);
    }
};

const getViaByCode = async (codi) => {
  try {
    const via = await Via.findOne({
      where: {codi: codi},
      include: [{ model: Agulla }]
    });
    return via
  } catch (error) {
    console.error('Error trobant vies:', error);
  }
};
  
  
module.exports = {
    getVia,
    getViaByCode
};