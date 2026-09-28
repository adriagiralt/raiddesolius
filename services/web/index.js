const express = require("express");
const path = require("path");

function createWebApp(data = require('./data-source')) {
  const app = express();

  // Servir carpeta public (HTML, CSS, JS)
  app.use(express.static(path.join(__dirname, "public")));

  // Endpoint rànquing equips
  app.get("/api/ranking", async (req, res) => {
    try {
      const ranking = await data.getRanking()
      res.json(ranking);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error obtenint el rànquing" });
    }
  });

  // Endpoint rànquing equips
  app.get("/api/ranking/agulles", async (req, res) => {
    try {
      const ranking = await data.getRankingByAgulla()
      res.json(ranking);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error obtenint el rànquing" });
    }
  });

  // Endpoint agulla més pujada
  app.get("/api/top-agulla", async (req, res) => {
    try {
      res.json(await data.getTopAgulla());
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error obtenint l'agulla més pujada" });
    }
  });

  // Endpoint últims encadenats
  app.get("/api/ultims", async (req, res) => {
  try {
    const ultims = await data.getLastEncadenats();
    res.json(ultims);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obtenint últims encadenats" });
  }
});

// Endpoint últims encadenats per equip
  app.get("/api/ultims/:equip", async (req, res) => {
  try {
    const equip = Number(req.params.equip);
    if (!/^[1-9]\d*$/.test(req.params.equip) || !Number.isSafeInteger(equip)) {
      return res.status(400).json({ error: "L'equip ha de ser un identificador enter positiu" });
    }
    const ultims = await data.getLastEncadenatsByTeam(equip);
    res.json(ultims);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obtenint últims encadenats" });
  }
});

  // Endpoint equips
  app.get("/api/equips", async (req, res) => {
  try {
    const equips = await data.getTeams()
    res.json(equips)
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obtenint llista d'equips" });
  }

  
  });

  // Endpoint equips no acabats
  app.get("/api/equips/actius", async (req, res) => {
  try {
    const equips = await data.getTeamsNoAcabat()
    res.json(equips)
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obtenint llista d'equips" });
  }

  
  });

  // Endpoint ranking agulles
  app.get("/api/agulles", async (req, res) => {
  try {
    const agulles = await data.getAgullaRanking()
    res.json(agulles)
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obtenint llista d'agulles" });
  }

  
  });

  return app;
}

function initWebServer(port = process.env.PORT || 3000) {
  return new Promise((resolve, reject) => {
    const server = createWebApp().listen(port, () => {
      console.log(`Web en marxa al port ${server.address().port}`);
      resolve(server);
    });
    server.once('error', reject);
  });
}

module.exports = { createWebApp, initWebServer };
