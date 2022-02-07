// Express Initialisation
const express = require("express");
const fs= require("fs");
const app = express();
const port = 3001;
let router = express.Router();
const cors = require("cors");
app.use(cors({ credentials: true }, "http://localhost:3000"));


// Sequelize Initialisation
const sequelize = require("./sequelize");
const { Op } = require("sequelize");


// Import created models
const Articol = require("./models/articol");
const Reference = require("./models/reference");

// Define entities relationship
Articol.hasMany(Reference, { as: "Reference", foreignKey: "ArticolId" });
Reference.belongsTo(Articol, { foreignKey: "ArticolId" });

// Express middleware
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(express.json());

// Kickstart the Express aplication
app.listen(port, () => {
  console.log("The server is running on http://localhost:" + port);
});

// Create a middleware to handle 500 status errors.
app.use((err, req, res, next) => {
  console.error("[ERROR]:" + err);
  res.status(500).json({ message: "500 - Server Error" });
});

/**
 * Create a special GET endpoint so that when it is called it will
 * sync our database with the models.
 */
app.get("/create", async (req, res, next) => {
  try {
    await sequelize.sync({ force: true });
    res.status(201).json({ message: "Database created with the models." });
  } catch (err) {
    next(err);
  }
});

//GET
//afisare articole impreuna cu referintele aferente
//(afisare toti parintii cu toti copiii aferenti)
async function getArticoleFull() {
  return await Articol.findAll({ include: "Reference"});
}
app.get("/get-articole-full", async (req, res) => {
  try {
      return res.json(await getArticoleFull());
  }
  catch (err) {
      console.log(err.message);
  }
})

//afisare doar articole fara referintele lor
//(afisare toti parintii, fara copiii lor)
async function getArticole() {
  return await Articol.findAll();
}
app.get("/get-articole", async (req, res) => {
  try {
      return res.json(await getArticole());
  }
  catch (err) {
      console.log(err.message);
  }
})

//afisare articol cu un anumit id
//(afisare parinte dupa id)
async function getArticolById(id) {
  return await Articol.findOne(
      {
          where: id ? { ArticolId: id } : undefined
      }
  );
}
app.get("/get-articole-by-id/:id", async (req, res) => {
  try {
      return res.json(await getArticolById(req.params.id));
  }
  catch (err) {
      console.log(err.message);
  }
})

//afisare toate referintele
//(afisare toti copiii indiferent de ce parinte au)
async function getReferences() {
  return await Reference.findAll();
}
app.get("/get-references", async (req, res) => {
  try {
      return res.json(await getReferences());
  }
  catch (err) {
      console.log(err.message);
  }
})

//afisare referinte ale unui anumit articol
//(afisare toti copiii unui parinte)
async function getReferencesByArticol(idArticol) {
  if (!(await getArticolById(idArticol))) {
      console.log("Nu s-a gasit articolul!");
      return;
  }
  return await Reference.findAll({
      include: [{ model: Articol, attributes: ["ArticolTitlu"], where: idArticol ? { ArticolId: idArticol } : undefined }]
  });
}
app.get("/get-references-by-articol/:idArticol",async (req, res) => {
  try {
      return res.json(await getReferencesByArticol(req.params.idArticol));
  }
  catch (err) {
      console.log(err.message);
  }
})

async function getReferenceByArticol(idArticol, idReference) {
  if (!(await getArticolById(idArticol))) {
      console.log("Nu s-a gasit articolul!");
      return;
  }
  return await Reference.findOne(
      {
          include: [{ model: Articol, attributes: ["ArticolTitlu"], where: idArticol ? { ArticolId: idArticol } : undefined }],
          where: idReference ? { ReferenceId: idReference } : undefined
      }
  )
}
app.get("/get-reference-by-articol/:idArticol/:idReference",
  async (req, res) => {
      try {
          return res.json(await getReferenceByArticol(req.params.idArticol, req.params.idReference));
      } catch (err) {
          console.log(err.message);
      }
  }
)

//afisare toate articolele dupa filtru titlu si/sau filtru rezumat
//(afisare parinti filtrati dupa 2 campuri)
async function getArticoleFilter(filterQuery) {
  let whereClause = {};

  if (filterQuery.titlu)
      whereClause.ArticolTitlu = { [Op.like]: `%${filterQuery.titlu}%` };
  if (filterQuery.rezumat)
      whereClause.ArticolRezumat = { [Op.like]: `%${filterQuery.rezumat}%` };

  return await Articol.findAll({
      where: whereClause
  })
}
app.get("/get-articole-filter", async (req, res) => {
  try {
      return res.json(await getArticoleFilter(req.query));
  }
  catch (err) {
      console.log(err.message);
  }
})

//afisare articole sortate descrescator dupa data
//(afisare parinti - sortare)
async function getArticoleSortateDupaData() {
  return await Articol.findAll({
      order: [
          ["ArticolData", "DESC"]
      ]
  });
}
app.get("/get-articole-sortate-dupa-data", async (req, res) => {
  try {
      return res.json(await getArticoleSortateDupaData());
  }
  catch (err) {
      console.log(err.message);
  }
})

//export sub forma de json
async function exportArticoleFull() {
  if (!fs.existsSync("./exported"))
      fs.mkdirSync("./exported")
  fs.writeFileSync("./exported/articole_full.json", JSON.stringify(await getArticoleFull()));
}
app.get("/export-articole-full", async (req, res) => {
  try {
      await exportArticoleFull();
      res.download("./exported/articole_full.json", "downloadArticoleFull.json");
  } catch (err) {
      console.log(err.message);
  }
})

//POST
//adaugare articol(adaugare parinte)
async function createArticol(articol) {
  return await Articol.create(articol);
}
app.post("/add-articol", async (req, res) => {
  try {
      return res.status(201).json(await createArticol(req.body));
  } catch (err) {
      console.log(err.message);
      return res.status(500).json({ error_message: "Internal server error! Could not insert articol!" });
  }
})

//adaugare referinta pentru un anumit articol
//(adaugare copil la parinte)
async function createReference(reference, idArticol) {
  if (!(await getArticolById(idArticol))) {
      console.log("Nu s-a gasit articolul");
      return;
  }
  reference.ArticolId = idArticol;
  return await Reference.create(reference);
}
app.post("/add-reference/:idArticol", async (req, res) => {
  try {
      return res.status(201).json(await createReference(req.body, req.params.idArticol));
  } catch (err) {
      console.log(err.message);
      return res.status(500).json({ error_message: "Internal server error! Could not insert referinta!" });
  }
})


//PUT
//update articol(update parinte)
async function updateArticol(updatedArticol, idArticol) {
  if (parseInt(idArticol) !== updatedArticol.ArticolId) {
      console.log("ID diferit intre id ruta si id body");
      return;
  }
  let articol = await getArticolById(idArticol);
  if (!articol) {
      console.log("Nu exista articolul cu acest id");
      return;
  }

  return await articol.update(updatedArticol);
}
app.put("/update-articol/:idArticol", async (req, res) => {
  try {
      return res.json(await updateArticol(req.body, req.params.idArticol));
  } catch (err) {
      console.log(err.message);
  }
})

//update referinta a unui articol
//(update copil al unui anumit parinte)
async function updateReference(updatedReference, idArticol, idReference) {
  if (parseInt(idReference) !== updatedReference.ReferenceId) {
      console.log("ID referinta diferit intre id ruta si id body");
      return;
  }

  let articol = await getArticolById(idArticol);
  if (!articol) {
      console.log("Nu exista articolul cu acest id");
      return;
  }

  let reference = await getReferenceByArticol(idArticol, idReference);
  if (!reference) {
      console.log("Nu exista referinta cu acest id pentru acest articol");
      return;
  }

  return await reference.update(updatedReference);
}
app.put("/update-reference/:idArticol/:idReference", async (req, res) => {
  try {
      return res.json(await updateReference(req.body, req.params.idArticol, req.params.idReference));
  } catch (err) {
      console.log(err.message);
  }
})

//DELETE
//sterge articol(delete parinte)
async function deleteArticol(idArticol) {
  let articolToBeDeleted = await getArticolById(idArticol);

  if (!articolToBeDeleted) {
      console.log("Nu exista articolul cu acest id");
      return;
  }

  return await articolToBeDeleted.destroy();
}
app.delete("/delete-articol/:idArticol", async (req, res) => {
  try {
      return res.json(await deleteArticol(req.params.idArticol));
  } catch (err) {
      console.log(err.message);
  }
})

//stergere referinta a unui anumit articol specific
//(stergere copil al unui parinte)
async function deleteReference(idArticol, idReference) {

  let articol = await getArticolById(idArticol);
  if (!articol) {
      console.log("Nu exista articolul cu acest id");
      return;
  }

  let referenceToBeDeleted = await getReferenceByArticol(idArticol, idReference);

  if (!referenceToBeDeleted) {
      console.log("Nu exista referinta cu acest id la acest articol");
      return;
  }

  return await referenceToBeDeleted.destroy();
}
app.delete("/delete-reference/:idArticol/:idReference",async (req, res) => {
  try {
      return res.json(await deleteReference(req.params.idArticol, req.params.idReference));
  } catch (err) {
      console.log(err.message);
  }
})