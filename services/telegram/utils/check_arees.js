const encadenatController = require('../../../controllers/encadenat.controller');

const check_arees = async (team_id, ctx) => {
  const arees = await encadenatController.getArees(team_id);
  if (arees >= 4) {
    const awarded = await encadenatController.awardOnce(team_id, 200, 4000, 20);
    if (awarded) await ctx.reply('Heu visitat 4 àrees! 20 punts extres!');
  }
};

module.exports = { check_arees };
