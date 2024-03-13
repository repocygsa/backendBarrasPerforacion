const router = require('../../Router/router');
const conector = require('../../conectorMysql/conectorMysql');
const jwt = require('jsonwebtoken');
const moment = require('moment');
moment.locale('es');


const MailServer = require('../../Mail/Mail');
const newMailer = new MailServer();
const Plantilla = require('../../Mail/MailTemplates/reporteAprendizaje/correoVacio')
const planti = new Plantilla()


const multer = require('multer');

var JSZip = require("jszip");
const fs = require("fs");
const utf8 = require("utf8");

const generarImages = require('../../puppeteer/generarImg');
const generarImagesStatus = require('../../puppeteer/generarImgStatus');


 router.post("/getPermisoSessionBDP", (req, res) => {
  const datosSesion = req.body.res.data
  let rut= ""
  if (req.body.res.data.rut) {
    rut = req.body.res.data.rut
  }
 
  const sql = `select * from bdp_usuarios where rut=?`;
    conector.query(sql,[rut], (err, result) => {
    if (err) throw err;
      res.status(200).json({permiso:result,datosSesion});
    })
})


router.post('/getContratos',(req,res)=>{
  
  const empre = req.body.datos;

  sql = `
  SELECT 'Todo' AS  num_ctto
  UNION
  SELECT
  ctto.num_ctto
  FROM tbl_ctto ctto
  WHERE ctto.act_ctto = 1
  AND ctto.emp_ctto = ?
  
  `;
  conector.query(sql, [empre], (error,result)=>{
    if(error) throw error;        
    res.status(200).json({result})
  })
    
});

router.post("/getEmpresa", (req, res) => {
  // act empresa = 1   consultar
    const sql = `
    SELECT '0' AS  rut_empre, 'Todo' AS nom_empre
    UNION
    SELECT
    emp.rut_empre,
    emp.nom_empre
    FROM tbl_empre emp
    INNER JOIN tbl_ctto ctto
    ON emp.rut_empre = ctto.emp_ctto
    WHERE emp.act_empresa = 1
    GROUP BY 
    emp.rut_empre,
    emp.nom_empre
    `;
    conector.query(sql, (err, result) => {
      if (err) throw err;
      res.status(200).json({ result });
    });
  
  });

router.post("/getMina", (req, res) => {

  const sql = `
  SELECT
  id, 
  nom
  FROM rep_mina
  `;
  conector.query(sql, (err, result) => {
    if (err) throw err;
    res.status(200).json({ result });
  });

});

router.post("/getArea", (req, res) => {

  const mina = req.body.datos;

  const sql = `
  SELECT
  id, 
  nom
  FROM rep_area
  WHERE fk_rep_mina = ?
  `;
  conector.query(sql, [mina], (err, result) => {
    if (err) throw err;
    res.status(200).json({ result });
  });

});

router.post("/getNivel", (req, res) => {

  const sql = `
  SELECT
  id, 
  nom
  FROM rep_nivel
  WHERE est = 1
  `;
  conector.query(sql, (err, result) => {
    if (err) throw err;
    res.status(200).json({ result });
  });

});

const traeUltimoID = (callback) => {
 
  const sql = `SELECT MAX(id) AS ultimo_id FROM bdp_registro`;

  conector.query(
    sql,
    (err, result) => {
      if (err) throw err;
      const ultimoID = result[0].ultimo_id || 1; // Si no se encuentra ningún resultado, devuelve un 1
      callback(ultimoID);
    }
  );
};

router.post("/guardarBdp", async (req, res) => {
  try {
    const id = await new Promise((resolve, reject) => {
      traeUltimoID(resolve);
    });

  
    const cod_iden = `GOM-${req.body.datos.ctt_inf}-BP-${id===1?id:id+1}`;
    console.log(cod_iden)
    const fecha = moment().format('YYYY-MM-DD HH:mm');

    const sql = "INSERT INTO bdp_registro SET ?";

    let datosBdp = {
      fk_empresa: req.body.datos.emp_inf,
      fk_ctto: req.body.datos.ctt_inf,
      bdp_user: req.body.datos.bdp_user,
      bdp_tipo_acero: req.body.datos.bdp_tipo_acero,
      bdp_marca: req.body.datos.bdp_marca,
      bdp_fecha_hora: fecha,
      bdp_cod_identificador: cod_iden,
    };

 

    conector.query(sql, datosBdp, (error, result) => {
      if (error) throw error;
      res.status(200).json({ result });
    });
  } catch (error) {
    res.status(500).json({ error: "Error al guardar el registro" });
  }
});




module.exports = router;
