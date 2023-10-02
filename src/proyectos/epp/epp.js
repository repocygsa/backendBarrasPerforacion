const router = require('../../Router/router');
const conector = require('../../conectorMysql/conectorMysql');
const jwt = require('jsonwebtoken');
const moment = require('moment');
moment.locale('es');

const MailServer = require('../../Mail/Mail');
const newMailer = new MailServer();

const sendCodePass = require('../../Mail/MailTemplates/docu_trabajadores/sendCodePassDocu');
const bodyMail = new sendCodePass();

router.post('/getPermisoSessionEpp',(req,res)=>{
    
  const {rut, ctto} = req.body.res.data;
  const sql = `SELECT * FROM epp_usuarios WHERE rut = ? `

  conector.query(sql,[rut],(err, result)=>{

    if(err) throw err   

    let user = '';

    // Si existe en la tabla tiene un permiso y puede hacer otras cosas, de lo contrario es un usuario de la appsgom que sólo puede pedir epp si es jej
    if(result.length>0){
      
      user={
        rutUsu:result[0].rut,            
        perUsu:result[0].fk_perfil,
        cttUsu:ctto
      }
      
      res.status(200).json({user});

    }else{

      user={
        rutUsu:rut,
        perUsu:3,
        cttUsu:ctto
      }
    
      res.status(200).json({user});

    }
        
  })

 })

// Trae solamente los equipos que tengan inventario positivo
router.post('/getEquiposEpp',(req,res)=>{
        
  const sql =`SELECT 
  epp.id, 
  epp.des_epp AS nom
  FROM epp_equipo epp
  INNER JOIN 
  (
    SELECT 
    sto.fk_id_epp,
    IFNULL(ing.ingreso, 0) AS ingreso,
    IFNULL(egr.egreso, 0) AS egreso,
    IFNULL(ing.ingreso, 0) - IFNULL(egr.egreso, 0) AS total
    FROM epp_ccta_stock sto
    LEFT JOIN
    (
      SELECT 
      fk_id_epp,
      SUM(mov_epp_cant) AS ingreso
      FROM epp_ccta_stock
      WHERE fk_id_mov = 1
      GROUP BY fk_id_epp
    ) ing
    ON sto.fk_id_epp = ing.fk_id_epp
    LEFT JOIN
    (
      SELECT 
      fk_id_epp,
      SUM(mov_epp_cant) AS egreso
      FROM epp_ccta_stock
      WHERE fk_id_mov = 2
      GROUP BY fk_id_epp
    ) egr
    ON sto.fk_id_epp = egr.fk_id_epp
    GROUP BY sto.fk_id_epp
  ) stock
  ON epp.id = stock.fk_id_epp
  WHERE epp.est = 1
  AND stock.total > 0
  ORDER BY epp.des_epp ASC
  `
  conector.query(sql,(err,result)=>{
  if(err) throw err
    res.status(200).json(result)
  })

})

// Trae solamente los sexos de equipos que tengan inventario positivo
router.post('/getSexoByEppId',(req,res)=>{
     
  const {idEpp} = req.body;

  const sql =`SELECT 
  sex.id, 
  sex.des_sex AS nom
  FROM epp_sexo sex
  INNER JOIN 
  (
    SELECT 
    sto.fk_id_sexo,
    IFNULL(ing.ingreso, 0) AS ingreso,
    IFNULL(egr.egreso, 0) AS egreso,
    IFNULL(ing.ingreso, 0) - IFNULL(egr.egreso, 0) AS total
    FROM epp_ccta_stock sto
    LEFT JOIN
    (
      SELECT 
      fk_id_sexo,
      SUM(mov_epp_cant) AS ingreso
      FROM epp_ccta_stock
      WHERE fk_id_mov = 1
      AND fk_id_epp = '${idEpp}'
      GROUP BY fk_id_sexo
    ) ing
    ON sto.fk_id_sexo = ing.fk_id_sexo
    LEFT JOIN
    (
      SELECT 
      fk_id_sexo,
      SUM(mov_epp_cant) AS egreso
      FROM epp_ccta_stock
      WHERE fk_id_mov = 2
      AND fk_id_epp = '${idEpp}'
      GROUP BY fk_id_sexo
    ) egr
    ON sto.fk_id_sexo = egr.fk_id_sexo
    GROUP BY sto.fk_id_sexo
  ) stock
  ON sex.id = stock.fk_id_sexo
  WHERE stock.total > 0
  ORDER BY sex.des_sex ASC
  `
  conector.query(sql,(err,result)=>{
    if(err) throw err
    res.status(200).json(result)
  })

})


// Trae solamente las tallas de sexo de equipos que tengan inventario positivo
router.post('/getTallaByEppId',(req,res)=>{
     
  const {idEpp, idSex} = req.body;

  const sql =`SELECT 
  tal.id, 
  tal.des_tal AS nom,
  stock.total
  FROM epp_talla tal
  INNER JOIN 
  (
    SELECT 
    sto.fk_id_talla,
    IFNULL(ing.ingreso, 0) AS ingreso,
    IFNULL(egr.egreso, 0) AS egreso,
    IFNULL(ing.ingreso, 0) - IFNULL(egr.egreso, 0) AS total
    FROM epp_ccta_stock sto
    LEFT JOIN
    (
      SELECT 
      fk_id_talla,
      SUM(mov_epp_cant) AS ingreso
      FROM epp_ccta_stock
      WHERE fk_id_mov = 1
      AND fk_id_epp = '${idEpp}'
      AND fk_id_sexo = '${idSex}'
      GROUP BY fk_id_talla
    ) ing
    ON sto.fk_id_talla = ing.fk_id_talla
    LEFT JOIN
    (
      SELECT 
      fk_id_talla,
      SUM(mov_epp_cant) AS egreso
      FROM epp_ccta_stock
      WHERE fk_id_mov = 2
      AND fk_id_epp = '${idEpp}'
      AND fk_id_sexo = '${idSex}'
      GROUP BY fk_id_talla
    ) egr
    ON sto.fk_id_talla = egr.fk_id_talla
    GROUP BY sto.fk_id_talla
  ) stock
  ON tal.id = stock.fk_id_talla
  WHERE stock.total > 0
  ORDER BY tal.des_tal ASC
  `
  conector.query(sql,(err,result)=>{
    if(err) throw err
    res.status(200).json(result)
  })

})


const insertarDetalleEpp=(insertId, solicitud)=>{

  let idComp = '';

  solicitud.forEach(epp => {

    idComp = `${epp.detEpp}${epp.sexEpp}${epp.talEpp}`;

    const sql2 = 'INSERT INTO epp_solicitud_detalle (des_epp, fk_sexo, fk_talla, tip_sol, id_comp, can_solicitada, fk_solicitud) VALUES (?, ?, ?, 2, ?, ?, ?)';
    conector.query(sql2,[epp.detEpp, epp.sexEpp, epp.talEpp, idComp, epp.canEpp, insertId],(err2,result2)=>{
      if(err2) throw err2
    });

  });
  
}

router.post("/guardarSolicitudEpp", (req, res) => {

  const {solicitud, rutUsu, obsEpp, fonEpp, corEpp} = req.body.values;
  const sql = `INSERT INTO epp_solicitud(rut_solicitante,fec_solicitud,obs,fon_solicitante,cor_solicitante,est_solicitud) values(?,?,?,?,?,?)`;
 
  conector.query(sql,[rutUsu, new Date(),  obsEpp, fonEpp, corEpp, 1], (err, result) => {
    if (err) throw err;
    if(result.affectedRows>0){
      insertarDetalleEpp(result.insertId, solicitud)          
    }
    res.status(200).json(result);
  });

});

module.exports = router;