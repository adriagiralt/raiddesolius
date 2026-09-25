const Encadenat = require('../models/encadenat.model');
const sequelize = require('../utils/db');

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
    }
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
    }
}

const getRanking = async () => {
    try {
        const [results, metadata] = await sequelize.query("SELECT e.id, e.nom, SUM(enc.punts) as 'punts', COUNT(CASE WHEN enc.agulla_id <= 25 THEN 1 END) AS 'agulles' FROM equips e, encadenats enc WHERE e.id = enc.equip_id GROUP BY equip_id ORDER BY SUM(enc.punts) DESC");
        
        return results; // Retorna els resultats
      } catch (error) {
        console.error('Error al generar ranking', error);
        throw error; // Llança l'error per gestionar-ho més endavant si cal
      }
}

const getRankingByAgulla = async () => {
    try {
        const [results, metadata] = await sequelize.query("SELECT e.id, e.nom, SUM(enc.punts) as 'punts', COUNT(CASE WHEN enc.agulla_id <= 25 THEN 1 END) AS 'agulles' FROM equips e, encadenats enc WHERE e.id = enc.equip_id GROUP BY equip_id ORDER BY agulles, SUM(enc.punts) DESC");
        
        return results; // Retorna els resultats
      } catch (error) {
        console.error('Error al generar ranking', error);
        throw error; // Llança l'error per gestionar-ho més endavant si cal
      }
}

const getViesByEquip = async (equip) => {
  try {
    const [results, metadata] = await sequelize.query(`SELECT v.nom, a.nom as anom, enc.createdAt, enc.punts, v.grau, enc.grau as encgrau FROM agulles a, encadenats enc LEFT JOIN vies v ON enc.via_id = v.id WHERE enc.agulla_id = a.id AND enc.equip_id = ${equip} ORDER BY enc.createdAt ASC`);
    
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
    console.log("QUE POLLES PASSA?")
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
                                                      WHERE encadenats.equip_id = ${equip};
                                                      `)
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
      WHERE e.id = ${id}
      ORDER BY enc.createdAt DESC
    `);

    return results;
  } catch (error) {
    console.error("Error obtenint últims encadenats", error);
    throw error;
  }
};
  
  
module.exports = {
    setEncadenat,
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

