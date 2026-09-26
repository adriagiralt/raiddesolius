const Encadenat = require('../models/encadenat.model');
const sequelize = require('../utils/db');
const Equip = require('../models/equip.model');
const Via = require('../models/via.model');

const setEncadenat = async (equip, agulla, via, exit, punts, grau) => {
    try {
      const encadenat = await Encadenat.create({
        equip_id: equip,
        agulla_id: agulla,
        via_id: via,
        exit: exit,
        punts: punts,
        grau: grau
      });
      return encadenat
    } catch (error) {
      console.error('Error creant encadenat:', error);
      throw error;
    }
};

const replaceEncadenat = async (equip, agulla, via, exit, punts, grau = null) => {
  return sequelize.transaction(async transaction => {
    const team = await Equip.findByPk(equip, { transaction, lock: transaction.LOCK.UPDATE });
    if (!team) throw new Error('Equip inexistent');
    await Encadenat.destroy({ where: { equip_id: equip, agulla_id: agulla }, transaction });
    return Encadenat.create({ equip_id: equip, agulla_id: agulla, via_id: via, exit, punts, grau }, { transaction });
  });
};

// Bloqueja l'equip per atorgar bonus, o la via perquè cada tòtem només es pugui reclamar una vegada.
const awardOnce = async (equip, agulla, via, punts, global = false) => {
  return sequelize.transaction(async transaction => {
    const model = global ? Via : Equip;
    const owner = await model.findByPk(global ? via : equip, { transaction, lock: transaction.LOCK.UPDATE });
    if (!owner) throw new Error('Equip o via inexistent');
    const where = global ? { via_id: via } : { equip_id: equip, via_id: via };
    if (await Encadenat.findOne({ where, transaction, lock: transaction.LOCK.UPDATE })) return null;
    return Encadenat.create({ equip_id: equip, agulla_id: agulla, via_id: via, punts }, { transaction });
  });
};

const deleteEncadenatByAgullaTeam = async (agulla, equip) => {
    try {
        const encadenat = await Encadenat.destroy({
            where: { agulla_id: agulla,
                     equip_id: equip
                    }
        })
        return encadenat
    } catch (error) {
        console.error("Error agafant encadenats:", error)
      throw error;
    }
}

const getRanking = async () => {
    try {
        const [results, metadata] = await sequelize.query("SELECT e.id, e.nom, SUM(enc.punts) as 'punts', COUNT(CASE WHEN enc.agulla_id <= 25 THEN 1 END) AS 'agulles' FROM equips e, encadenats enc WHERE e.id = enc.equip_id GROUP BY e.id, e.nom ORDER BY SUM(enc.punts) DESC");
        
        return results; // Retorna els resultats
      } catch (error) {
        console.error('Error al generar ranking', error);
        throw error; // Llança l'error per gestionar-ho més endavant si cal
      }
}

const getRankingByAgulla = async () => {
    try {
        const [results, metadata] = await sequelize.query("SELECT e.id, e.nom, SUM(enc.punts) as 'punts', COUNT(CASE WHEN enc.agulla_id <= 25 THEN 1 END) AS 'agulles' FROM equips e, encadenats enc WHERE e.id = enc.equip_id GROUP BY e.id, e.nom ORDER BY agulles DESC, SUM(enc.punts) DESC");
        
        return results; // Retorna els resultats
      } catch (error) {
        console.error('Error al generar ranking', error);
        throw error; // Llança l'error per gestionar-ho més endavant si cal
      }
}

const getViesByEquip = async (equip) => {
  try {
    const [results, metadata] = await sequelize.query(`SELECT v.nom, a.nom as anom, enc.createdAt, enc.punts, v.grau, enc.grau as encgrau FROM agulles a, encadenats enc LEFT JOIN vies v ON enc.via_id = v.id WHERE enc.agulla_id = a.id AND enc.equip_id = :equip ORDER BY enc.createdAt ASC`, { replacements: { equip } });
    
    return results; // Retorna els resultats
  } catch (error) {
    console.error('Error al trobar les vies', error);
    throw error; // Llança l'error per gestionar-ho més endavant si cal
  }
}

const getEncadenatByViaId = async (via_id) => {
  try {
    const encadenat = await Encadenat.findOne({
      where: { via_id: via_id }
    });
    return encadenat
  } catch (error) {
    console.log("Error al trobar l'encadenat", error);
    throw error; // Llança l'error per gestionar-ho més endavant si cal
  }
}

const getEncadenatByEquipIViaId = async (equip_id, via_id) => {
  try {
    const encadenat = await Encadenat.findOne({
      where: { equip_id: equip_id, via_id: via_id }
    });
    return encadenat
  } catch (error) {
    console.log("Error al trobar l'encadenat", error);
    throw error; // Llança l'error per gestionar-ho més endavant si cal
  }
}

const getArees = async (equip) => {
  try {
    const [results, metadata] = await sequelize.query(`SELECT COUNT(DISTINCT agulles.area_id) AS nombre_arees
                                                      FROM encadenats
                                                      JOIN agulles ON encadenats.agulla_id = agulles.id
                                                      WHERE encadenats.equip_id = :equip;
                                                      `, { replacements: { equip } })
    return results[0].nombre_arees
  } catch (error) {
    console.error('Error al obtenir zones', error);
    throw error; // Llança l'error per gestionar-ho més endavant si cal
  }
}

const getLastEncadenats = async () => {
  try {
    const [results, metadata] = await sequelize.query(`
      SELECT 
        e.nom AS equipNom,
        a.nom AS agullaNom,
        v.nom AS viaNom,
        enc.punts AS punts,
        enc.createdAt
      FROM encadenats enc
      LEFT JOIN equips e ON enc.equip_id = e.id
      LEFT JOIN agulles a ON enc.agulla_id = a.id
      LEFT JOIN vies v ON enc.via_id = v.id
      ORDER BY enc.createdAt DESC
    `);

    return results;
  } catch (error) {
    console.error("Error obtenint últims encadenats", error);
    throw error;
  }
};

  const getLastEncadenatsByTeam = async (id) => {
  try {
    const [results, metadata] = await sequelize.query(`
      SELECT 
        e.nom AS equipNom,
        a.nom AS agullaNom,
        v.nom AS viaNom,
        enc.punts AS punts,
        enc.createdAt
      FROM encadenats enc
      LEFT JOIN equips e ON enc.equip_id = e.id
      LEFT JOIN agulles a ON enc.agulla_id = a.id
      LEFT JOIN vies v ON enc.via_id = v.id
      WHERE e.id = :id
      ORDER BY enc.createdAt DESC
    `, { replacements: { id } });

    return results;
  } catch (error) {
    console.error("Error obtenint últims encadenats", error);
    throw error;
  }
};
  
  
module.exports = {
    setEncadenat,
    replaceEncadenat,
    awardOnce,
    deleteEncadenatByAgullaTeam,
    getRanking,
    getRankingByAgulla,
    getViesByEquip,
    getEncadenatByViaId,
    getArees,
    getEncadenatByEquipIViaId,
    getLastEncadenats,
    getLastEncadenatsByTeam
};

