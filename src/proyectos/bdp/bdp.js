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

const traeUltimoID = (ctto, callback) => {

  const condicion = ctto?`AND fk_ctto = '${ctto}'`:''
 
  const sql = `SELECT COUNT(id) AS ultimo_id FROM bdp_registro where id > 0 ${condicion}` ;
  conector.query(
    sql,
    (err, result) => {
      if (err) throw err;
      const ultimoID = result[0].ultimo_id+1 || 1; // Si no se encuentra ningún resultado, devuelve un 1
      callback(ultimoID);
    }
  );
};

router.post("/guardarBdp", async (req, res) => {



  try {
    const ctto = req.body.datos.ctt_inf;
    const id = await new Promise((resolve, reject) => {
      traeUltimoID(ctto, resolve);
    });

  
    const cod_iden = `GOM-${req.body.datos.ctt_inf}-BP-${id}`;
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

router.post("/getBDP", (req, res) => {


const empre=req.body.data.emp_inf?req.body.data.emp_inf:'0'
const ctt=req.body.data.ctt_inf?req.body.data.ctt_inf:'Todo'
const asig=req.body.data.asignacionResponsable?req.body.data.asignacionResponsable:0


  const emp = empre !== '0'? `AND gobm.bdp_registro.fk_empresa = '${req.body.data.emp_inf}' ` :'';
  const ctto = ctt !=='Todo'? `AND gobm.bdp_registro.fk_ctto = '${req.body.data.ctt_inf}'` :'';
  

  const est = asig === 0? '' : 
  req.body.data.asignacionResponsable === 1 ? `AND gobm.bdp_registro.fk_causa > 0` : 
  `AND gobm.bdp_registro.fk_causa IS NULL`;



  const sql = `
  SELECT
	gobm.bdp_registro.id,
	gobm.bdp_registro.fk_empresa,
	gobm.tbl_empre.nom_empre,
	gobm.bdp_registro.fk_ctto,
	gobm.bdp_registro.bdp_user,
	gobm.bdp_registro.bdp_tipo_acero,
	gobm.bdp_registro.bdp_marca,
	gobm.bdp_registro.bdp_fecha_hora,
	gobm.bdp_registro.bdp_cod_identificador,
	tofitobd.DotacionCC.Nombre,
	gobm.bdp_registro.fk_causa,
	gobm.bdp_registro.fk_rut_responsable,
	gobm.bdp_registro.bdp_obs,
	gobm.bdp_registro.bdp_fec_hora_ret,
	gobm.bdp_causal_retiro.bdp_causal,
	dot_resp.Nombre AS nom_resp 
FROM
	gobm.tbl_empre
	INNER JOIN gobm.bdp_registro ON gobm.bdp_registro.fk_empresa = gobm.tbl_empre.rut_empre
	INNER JOIN tofitobd.DotacionCC ON gobm.bdp_registro.bdp_user = tofitobd.DotacionCC.Rut
	LEFT JOIN gobm.bdp_causal_retiro ON gobm.bdp_registro.fk_causa = gobm.bdp_causal_retiro.id
	LEFT JOIN tofitobd.DotacionCC AS dot_resp ON gobm.bdp_registro.fk_rut_responsable = dot_resp.Rut
WHERE gobm.bdp_registro.id > 0
${emp}
${ctto}
${est}

  `;
  conector.query(sql, (err, result) => {
    if (err) throw err;
    res.status(200).json({ result });
  });

});

router.post("/getCausal", (req, res) => {

  const sql = `
    SELECT
    *
    FROM
    bdp_causal_retiro
  `;
  conector.query(sql, (err, result) => {
    if (err) throw err;
    res.status(200).json({ result });
  });

});

router.post("/updBarra", (req, res) => {

const causa= req.body.data.bpd_causa
const rut= req.body.data.rut_usu
const obs= req.body.data.bdp_obs
const fec= moment().format('YYYY-MM-DD HH:mm')
const id= req.body.data.id?req.body.data.id:0

  const sql = `
    UPDATE bdp_registro set fk_causa =${causa}, fk_rut_responsable ='${rut}', bdp_obs='${obs}', bdp_fec_hora_ret='${fec}'
    WHERE id = ${id}
  `;
  conector.query(sql, (err, result) => {
    if (err) throw err;
    res.status(200).json({ result });
  });
});

router.post("/getCtaCascos", (req, res) => {

  const sql = `
  SELECT
  tofitobd.DotacionCC.Rut,
  tofitobd.DotacionCC.Nombre,
  tofitobd.DotacionCC.Gerencia,
  tofitobd.DotacionCC.Empresa,
  tofitobd.DotacionCC.Contrato,
  tofitobd.DotacionCC.RutEmpresa 
FROM
  tofitobd.DotacionCC
WHERE Gerencia ='GOBM'
  `;
  conector.query(sql, (err, result) => {
    if (err) throw err;
    res.status(200).json({ result });
  });

});

module.exports = router;
