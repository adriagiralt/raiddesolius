const encadenatController = require('../../../controllers/encadenat.controller');

const check_arees = async (team_id, ctx) => {
    const arees = await encadenatController.getArees(team_id)

    if (arees == 4) {
      const tincBonus = await encadenatController.getEncadenatByEquipIViaId(team_id, 4000)

      if (tincBonus == null) {
        await encadenatController.setEncadenat(team_id, 200, 4000, null, 20, null)
        ctx.reply("Heu visitat 4 àrees! 20 punts extres!")
      }
    }
  }

module.exports = { 
    check_arees 
};