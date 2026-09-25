const express = require("express");
const path = require("path");
const db = require("../../utils/db");

// Models
const Equip = require("../../models/equip.model");
const Agulla = require("../../models/agulla.model");
const Encadenat = require("../../models/encadenat.model");

const userController = require('../../controllers/user.controller');
const encadenatController = require('../../controllers/encadenat.controller');
const equipController = require('../../controllers/team.controller')
const agullaController = require('../../controllers/agulla.controller')

function initWebServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Servir carpeta public (HTML, CSS, JS)
  app.use(express.static(path.join(__dirname, "public")));

  // Endpoint rànquing equips
  app.get("/api/ranking", async (req, res) => {
    try {
      const ranking = await encadenatController.getRanking()
      res.json(ranking);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error obtenint el rànquing" });
    }
  });

  // Endpoint rànquing equips
  app.get("/api/ranking/agulles", async (req, res) => {
    try {
      const ranking = await encadenatController.getRankingByAgulla()
      res.json(ranking);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error obtenint el rànquing" });
    }
  });

  // Endpoint agulla més pujada
  app.get("/api/top-agulla", async (req, res) => {
    try {
      const top = await Encadenat.findAll({
        attributes: [
          "agulla_id",
          [db.fn("COUNT", db.col("agulla_id")), "total"],
        ],
        group: ["agulla_id"],
        order: [[db.literal("total"), "DESC"]],
        limit: 1,
        include: [{ model: Agulla, attributes: ["nom"] }],
      });

      res.json(top[0] || null);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error obtenint l'agulla més pujada" });
    }
  });

  // Endpoint últims encadenats
  app.get("/api/ultims", async (req, res) => {
  try {
    const ultims = await encadenatController.getLastEncadenats();
    res.json(ultims);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obtenint últims encadenats" });
  }
});

// Endpoint últims encadenats per equip
  app.get("/api/ultims/:equip", async (req, res) => {
  try {
    const ultims = await encadenatController.getLastEncadenatsByTeam(req.params.equip);
    res.json(ultims);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obtenint últims encadenats" });
  }
});

  // Endpoint equips
  app.get("/api/equips", async (req, res) => {
  try {
    const equips = await equipController.getTeams()
    res.json(equips)
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obtenint llista d'equips" });
  }

  
  });

  // Endpoint equips no acabats
  app.get("/api/equips/actius", async (req, res) => {
  try {
    const equips = await equipController.getTeamsNoAcabat()
    res.json(equips)
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obtenint llista d'equips" });
  }

  
  });

  // Endpoint ranking agulles
  app.get("/api/agulles", async (req, res) => {
  try {
    const agulles = await agullaController.getAgullaRanking()
    res.json(agulles)
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obtenint llista d'agulles" });
  }

  
  });

  // Arrencar servidor
  app.listen(PORT, () => {
    console.log(`🌐 Web en marxa a http://localhost:${PORT}`);
  });
}

module.exports = { initWebServer };