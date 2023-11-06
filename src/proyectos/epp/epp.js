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

    const sql2 = 'INSERT INTO epp_solicitud_detalle (des_epp, fk_sexo, fk_talla, tip_sol, id_comp, can_solicitada, fk_solicitud, can_reservada) VALUES (?, ?, ?, 2, ?, ?, ?,?)';
    conector.query(sql2,[epp.detEpp, epp.sexEpp, epp.talEpp, idComp, epp.canEpp, insertId,epp.canEpp],(err2,result2)=>{
      if(err2) throw err2
    });

  });
  
}

router.post("/guardarSolicitudEpp", (req, res) => {

  const {solicitud, rutUsu, obsEpp, fonEpp, corEpp} = req.body.values;
  const sql = `INSERT INTO epp_solicitud(rut_solicitante,fec_solicitud,obs,fon_solicitante,cor_solicitante,est_solicitud, status_solicitud) values(?,?,?,?,?,?,?)`;
 
  conector.query(sql,[rutUsu, new Date(),  obsEpp, fonEpp, corEpp, 1, 1], (err, result) => {
    if (err) throw err;
    if(result.affectedRows>0){
      insertarDetalleEpp(result.insertId, solicitud)          
    }
    res.status(200).json(result);
    
  });

});


router.post('/getListaSolicitudes',(req,res)=>{

  const {fechadesde, fechahasta} = req.body.values;

  const fds = moment(fechadesde).format('YYYY-MM-DD');
  const fhs = moment(fechahasta).format('YYYY-MM-DD');
        
  const sql =`SELECT 
  sol.id,
  sol.rut_solicitante,
  sol.status_solicitud,
  sol.fec_hora_entrega,
  sol.lugar_entrega_solicitud,
  sol.obs_solicitud,
  dcc.Nombre AS nomsolicita,
  dcc.Empresa,
  dcc.Contrato,
  sol.fec_solicitud,
  IF(sol.obs = '', 'Sin observaciones', sol.obs) AS obs,
  sol.cor_solicitante,
  IF(sol.fon_solicitante = '', 'No informado', sol.fon_solicitante) AS fon_solicitante
  FROM epp_solicitud sol
  LEFT JOIN tofitobd.DotacionCC dcc
  ON sol.rut_solicitante = dcc.Rut
  WHERE DATE(sol.fec_solicitud) BETWEEN ? AND ?
  ORDER BY sol.fec_solicitud DESC
  `
  conector.query(sql, [fds, fhs], (err,result)=>{
  if(err) throw err
    res.status(200).json(result)
  })

})

router.post('/getSolicitudesId',(req,res)=>{

 const id = req.body.data[0].id

const fId = id !=='0'?`AND fk_solicitud =${id}`:''
        
  const sql =`
  SELECT
    gobm.epp_solicitud_detalle.id,
    gobm.epp_solicitud_detalle.des_epp AS epp_id,
    gobm.epp_solicitud_detalle.fk_sexo,
    gobm.epp_talla.des_tal,
    gobm.epp_sexo.des_sex,
    gobm.epp_solicitud_detalle.fk_talla,
    gobm.epp_solicitud_detalle.tip_sol,
    gobm.epp_solicitud_detalle.id_comp,
    gobm.epp_solicitud_detalle.can_solicitada,
    gobm.epp_solicitud_detalle.fk_solicitud,
    gobm.epp_equipo.des_epp,
    gobm.epp_solicitud.rut_solicitante,
    gobm.epp_solicitud.fec_solicitud,
    gobm.epp_solicitud.obs,
    gobm.epp_solicitud_detalle.can_reservada,
    tofitobd.DotacionCC.Nombres,
    tofitobd.DotacionCC.ApellidoPaterno,
    tofitobd.DotacionCC.ApellidoMaterno,
    (
      COALESCE(
          (
              SELECT SUM(mov_epp_cant)
              FROM gobm.epp_ccta_stock
              WHERE id_comp = gobm.epp_solicitud_detalle.id_comp
              AND fk_id_mov = 1
          ), 0
      ) -
      COALESCE(
          (
              SELECT SUM(mov_epp_cant)
              FROM gobm.epp_ccta_stock
              WHERE id_comp = gobm.epp_solicitud_detalle.id_comp
              AND fk_id_mov = 2
          ), 0
      )
  ) AS stock
FROM
	gobm.epp_solicitud_detalle
	INNER JOIN gobm.epp_sexo ON epp_solicitud_detalle.fk_sexo = epp_sexo.id
	INNER JOIN gobm.epp_talla ON epp_solicitud_detalle.fk_talla = epp_talla.id
	INNER JOIN gobm.epp_equipo ON epp_solicitud_detalle.des_epp = epp_equipo.id
	INNER JOIN gobm.epp_solicitud ON epp_solicitud_detalle.fk_solicitud = epp_solicitud.id
	INNER JOIN tofitobd.DotacionCC ON gobm.epp_solicitud.rut_solicitante = tofitobd.DotacionCC.Rut
WHERE est_solicitud > 0
${fId}
  `

  conector.query(sql, (err,result)=>{
  if(err) throw err
    res.status(200).json(result)
  })

})

router.post('/updCantidadReserva',(req,res)=>{

  const id = req.body.data.sel_epp
 const cantidad =req.body.data.epp_cantidad
 const fId = id !=='0'?`AND id =${id}`:''

         
   const sql =`
   UPDATE
   gobm.epp_solicitud_detalle
   SET
   can_reservada=${cantidad}   
   WHERE id > 0
 ${fId}
   `
 
   conector.query(sql, (err,result)=>{
   if(err) throw err
     res.status(200).json(result)
   })
 
 })

router.post('/getTalla',(req,res)=>{
  const id = req.body.datos?req.body.datos:'0'; 

const tipo = id?`and tip_tal ='${id}'`:''
  sql = `
SELECT * FROM epp_talla where tip_tal = ${id}
  `;
  conector.query(sql, (error,result)=>{
  if(error) throw error;        
    res.status(200).json({result})
  })

}); 

router.post('/getSexo',(req,res)=>{
  const id = req.body.data?req.body.data:'0'; 

  sql = `
select * from epp_sexo where tip_sex = ${id}
  `;
  conector.query(sql, (error,result)=>{
  if(error) throw error;        
    res.status(200).json({result})
  })

}); 
router.post('/getMaterial',(req,res)=>{
  const id = req.body.data?req.body.data:'0'; 

  sql = `
select * from epp_equipo 
  `;
  conector.query(sql, (error,result)=>{
  if(error) throw error;        
    res.status(200).json({result})
  })

}); 

router.post('/getEppAll',(req,res)=>{
  const talla = req.body.data.epp_talla?req.body.data.epp_talla:0
  const sexo = req.body.data.epp_sexo?req.body.data.epp_sexo:0
  const epp = req.body.data.sel_epp?req.body.data.sel_epp:0

  const ftalla =talla?`AND epp_ccta_stock.fk_id_talla = ${talla}`:'';
  const fsexo =sexo?`AND epp_ccta_stock.fk_id_sexo = ${sexo}`:'';
  const fepp =epp?`AND epp_ccta_stock.fk_id_epp = ${epp}`:'';

  sql = `

SELECT
    gobm.epp_ccta_stock.id_comp,
    gobm.epp_equipo.des_epp,
    gobm.epp_talla.des_tal,
    gobm.epp_sexo.des_sex,
    SUM(CASE WHEN gobm.epp_ccta_stock.fk_id_mov = 1 THEN gobm.epp_ccta_stock.mov_epp_cant ELSE 0 END) -
    SUM(CASE WHEN gobm.epp_ccta_stock.fk_id_mov = 2 THEN gobm.epp_ccta_stock.mov_epp_cant ELSE 0 END) AS suma_cantidades,

    SUM(CASE WHEN gobm.epp_ccta_stock.fk_id_mov = 1 THEN gobm.epp_ccta_stock.mov_epp_cant ELSE 0 END) AS suma_cantidades_1,
    SUM(CASE WHEN gobm.epp_ccta_stock.fk_id_mov = 2 THEN gobm.epp_ccta_stock.mov_epp_cant ELSE 0 END) AS suma_cantidades_2

FROM
    gobm.epp_ccta_stock
    INNER JOIN gobm.epp_equipo ON epp_ccta_stock.fk_id_epp = epp_equipo.id
    INNER JOIN gobm.epp_talla ON epp_ccta_stock.fk_id_talla = epp_talla.id
    INNER JOIN gobm.epp_sexo ON epp_ccta_stock.fk_id_sexo = epp_sexo.id
WHERE
    gobm.epp_ccta_stock.fk_id_mov IN (1, 2)
    ${fepp}
    ${ftalla}
    ${fsexo}
GROUP BY
    gobm.epp_ccta_stock.id_comp,
    gobm.epp_equipo.des_epp,
    gobm.epp_talla.des_tal,
    gobm.epp_sexo.des_sex;


  `;
  conector.query(sql, (error,result)=>{
  if(error) throw error;        
    res.status(200).json({result})
  })

}); 

router.post('/getEppAllDetalle',(req,res)=>{

  const epp = req.body.data[0].id_comp?req.body.data[0].id_comp:0


  const fepp =epp?`AND epp_ccta_stock.id_comp = ${epp}`:'';

  

  sql = `
  SELECT
	gobm.epp_ccta_stock.id,
	gobm.epp_ccta_stock.fk_id_epp,
	gobm.epp_equipo.des_epp,
	gobm.epp_ccta_stock.fk_id_talla,
	gobm.epp_talla.des_tal,
	gobm.epp_ccta_stock.fk_id_sexo,
	gobm.epp_sexo.des_sex,
	gobm.epp_ccta_stock.mov_epp_cant,
	gobm.epp_ccta_stock.fk_id_mov,
	gobm.epp_tipo_mov.movi_desc,
	gobm.epp_ccta_stock.mov_epp_fecha,
	gobm.epp_ccta_stock.id_comp,
	gobm.epp_ccta_stock.rut_resp,
	tofitobd.DotacionCC.Nombres,
	tofitobd.DotacionCC.ApellidoPaterno,
	tofitobd.DotacionCC.ApellidoMaterno 
FROM
	gobm.epp_ccta_stock
	INNER JOIN gobm.epp_equipo ON epp_ccta_stock.fk_id_epp = epp_equipo.id
	INNER JOIN gobm.epp_talla ON epp_ccta_stock.fk_id_talla = epp_talla.id
	INNER JOIN gobm.epp_sexo ON epp_ccta_stock.fk_id_sexo = epp_sexo.id
	INNER JOIN gobm.epp_tipo_mov ON epp_ccta_stock.fk_id_mov = epp_tipo_mov.id
	INNER JOIN tofitobd.DotacionCC ON gobm.epp_ccta_stock.rut_resp = tofitobd.DotacionCC.Rut
WHERE 
gobm.epp_ccta_stock.fk_id_mov <=2

${fepp}

  `;
  conector.query(sql, (error,result)=>{
  if(error) throw error;        
    res.status(200).json({result})
  })

}); 

router.post('/getEppAllCount',(req,res)=>{
  const talla = req.body.data.epp_talla?req.body.data.epp_talla:0
  const sexo = req.body.data.epp_sexo?req.body.data.epp_sexo:0
  const epp = req.body.data.sel_epp?req.body.data.sel_epp:0

  const ftalla =talla?`AND epp_ccta_stock.fk_id_talla = ${talla}`:'';
  const fsexo =sexo?`AND epp_ccta_stock.fk_id_sexo = ${sexo}`:'';
  const fepp =epp?`AND epp_ccta_stock.fk_id_epp = ${epp}`:'';

  sql = `
  SELECT COUNT(gobm.epp_ccta_stock.id)
  FROM gobm.epp_ccta_stock
  WHERE 
  epp_ccta_stock.id > 0
  ${fepp}
  ${ftalla}
  ${fsexo}
  `;
  conector.query(sql, (error,result)=>{
  if(error) throw error;        
    res.status(200).json({result})
  })

}); 
/*
router.post("/insertStock", (req, res) => {
  const fecha = moment().format('YYYY-MM-DD')
  const status = 3
  
  const sql= "INSERT INTO epp_ccta_stock SET ?";
const epp =req.body.data
const dataArray = req.body.data.solicitud
dataArray.map((data) => {
  console.log(data,'loginsert')

  const compuesto = parseInt(epp.sel_epp.toString()+epp.epp_talla.toString() + epp.epp_sexo.toString());
  let datosArchivos = {
    fk_id_epp: data.detEpp,
    fk_id_talla:data.talEpp,
    fk_id_sexo:data.sexEpp,
    mov_epp_cant: data.canEpp,
    mov_epp_fecha: fecha,
    fk_id_mov:1,
    rut_resp:'17.526.007-2',
    id_comp:compuesto
  };

  conector.query(sql, datosArchivos, (error,result)=>{
    if(error) throw error;      
    res.status(200).json({result})
  })
});



}); */

router.post("/insertStock", async (req, res) => {
  const fecha = moment().format('YYYY-MM-DD hh:mm');
  const status = 3;

  const sql = "INSERT INTO epp_ccta_stock SET ?";
  const epp = req.body.data.dataSolicitud;
  const dataArray = req.body.data.dataSolicitud.solicitud;

  try {
    const result=''
    for (const data of dataArray) {
    
      const compuesto = parseInt(data.detEpp.toString() +data.sexEpp.toString()+ data.talEpp.toString() )
      let datosArchivos = {
        fk_id_epp: data.detEpp,
        fk_id_talla: data.talEpp,
        fk_id_sexo: data.sexEpp,
        mov_epp_cant: data.canEpp,
        mov_epp_fecha: fecha,
        fk_id_mov: 1,
        rut_resp: req.body.data.usuario,
        id_comp: compuesto
      };

      await new Promise((resolve, reject) => {
        conector.query(sql, datosArchivos, (error, resultado) => {
          if (error) {
            reject(error);
          } else {
            resolve(resultado);
          }
        });
      });
    }
    res.status(200).json(1);
    
  } catch (error) {
    res.status(500).json({ error: "Error en las inserciones", details: error });
   
  }
});

const updateEstadoSol=(insertId, form, dataArray)=>{

const tipo = form.tipo

const fecEntrega = moment(form.ftur_ultima_actividad).format('DD-MM-YYYY HH:mm')
// console.log(moment(fecEntrega).format('DD-MM-YYYY HH:mm'), 'funcion insertid')
const lugar = form.ftur_mejora
const obs = form.obs_epp
const Nombre = form.nomUser
const rut = form.user
const correo = form.correo
const statusObs = tipo ===2?'Su solicitud ha sido aprobada. Por favor, diríjase a retirar los elementos en la fecha, hora y lugar programado.':'Los EPP han sido entregados, por lo tanto, su solicitud ha sido finalizada.'
  const sql2 = `UPDATE epp_solicitud set status_solicitud = ${form.tipo},  fec_hora_entrega ='${moment(form.ftur_ultima_actividad).format('YYYY-MM-DD HH:mm')}',  lugar_entrega_solicitud = '${lugar}', obs_solicitud='${obs}' where id =${insertId} `;
  
  const tableRows = dataArray.map(dataItem => {
    return `
    <tr>
        
        <td>${dataItem.des_epp}</td>
        <td>${dataItem.des_tal}</td>
        <td>${dataItem.des_sex}</td>
        <td>${dataItem.can_solicitada}</td>
        <td>${dataItem.can_reservada}</td>
       
      </tr>
    `;
  });
  
  const tableHTML = `
  <div style="text-align: center;">
  <table class="tech-table">
    <tr>
       
        <th>Elemento de protección personal</th>
        <th>Talla</th>
        <th>Sexo</th>
        <th>Solicitado</th>
        <th>Reservado</th>
      </tr>
      ${tableRows.join('')}
    </table>
  `;
  
  const body = `
  <!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Document</title>
</head>
<style>
.tech-table {
    border-collapse: collapse;
    width: 50%;
    margin: 20px;
}

.tech-table th, .tech-table td {
    border: 1px solid #dddddd;
    text-align: left;
    padding: 8px;
    font-family: 'Calibri', sans-serif;
    white-space: nowrap; /* Evita que el texto se divida en varias líneas */
}

.tech-table th {
    background-color: #E55302;
    color: white;
    font-size: 16px;
    
    font-weight: bold;
    letter-spacing: 1px;
    height: 30px;
    max-height: 30px; /* Altura máxima para evitar que se agranden en Outlook */
}

.tech-table tr:nth-child(even) {
    background-color: #f2f2f2;
}

.tech-table tr:nth-child(odd) {
    background-color: #e6e6e6;
}
</style>

<body>
<!-- © 2022 Shift Technologies. All rights reserved. -->
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout:fixed;background-color:#f9f9f9" id="bodyTable">
<tbody>
<tr>
<td style="padding-right:10px;padding-left:10px;" align="center" valign="top" id="bodyCell">
 <table border="0" cellpadding="0" cellspacing="0" width="100%" class="wrapperBody" style="max-width:600px">
   <tbody>
     <tr>
       <td align="center" valign="top">
         <table border="0" cellpadding="0" cellspacing="0" width="100%" class="tableCard" style="background-color:#fff;border-color:#e5e5e5;border-style:solid;border-width:0 1px 1px 1px;">
           <tbody>
             <tr>
               <td style="background-color:#f47600;font-size:1px;line-height:3px" class="topBorder" height="3">&nbsp;</td>
             </tr>                    
             <tr>
               <td style="padding-bottom: 10px;" align="center" valign="middle" class="emailLogo">
                                         <h2 class="text" style="color:#000;font-family:Trebuchet MS, Lucida Sans Unicode, Lucida Grande, Lucida Sans, Arial, sans-serif;font-size:30px;font-weight:500;font-style:normal;letter-spacing:normal;line-height:36px;text-transform:none;text-align:center;padding:0;margin:0"><small>Cambio de estado en la solicitud de EPP</h2>
               </td>
             </tr>
             
             
             <tr>
             <td style="padding-bottom: 5px; padding-left: 20px; padding-right: 20px;" align="center" valign="top" class="mainTitle">
               <h3 class="text" style="color:#000;font-family:Poppins,Helvetica,Arial,sans-serif;font-size:20px;font-weight:500;font-style:normal;letter-spacing:normal;line-height:36px;text-transform:none;text-align:center;padding:0;margin:0">${statusObs}</h3>
             </td>
           </tr>

             <tr>
               <td style="padding-bottom: 30px; padding-left: 20px; padding-right: 20px;" align="center" valign="top" class="subTitle">
                 <h4 class="text" style="color:#999;font-family:Poppins,Helvetica,Arial,sans-serif;font-size:10px;font-weight:500;font-style:normal;letter-spacing:normal;line-height:24px;text-transform:none;text-align:center;padding:0;margin:0"></h4>
               </td>
             </tr>

             <tr>
             <td style="padding-left: 20px; padding-right: 20px;" align="center" valign="top" class="mainTitle">
               <h2 class="text" style="color:#000;font-family:Poppins,Helvetica,Arial,sans-serif;font-size:14px;font-weight:500;font-style:normal;letter-spacing:normal;line-height:36px;text-transform:none;text-align:left;padding:0;margin:0"><b>Número de Solicitud: </b> ${insertId}</h2>
             </td>
           </tr>


   
           <tr>
           <td style="padding-left: 20px; padding-right: 20px;" align="center" valign="top" class="mainTitle">
             <h2 class="text" style="color:#000;font-family:Poppins,Helvetica,Arial,sans-serif;font-size:14px;font-weight:100;font-style:normal;letter-spacing:normal;line-height:36px;text-transform:none;text-align:left;padding:0;margin:0"><b>Rut:</b> ${rut}</h2>
           </td>
         </tr>
         <tr>
         <td style="padding-left: 20px; padding-right: 20px;" align="center" valign="top" class="mainTitle">
           <h2 class="text" style="color:#000;font-family:Poppins,Helvetica,Arial,sans-serif;font-size:14px;font-weight:100;font-style:normal;letter-spacing:normal;line-height:36px;text-transform:none;text-align:left;padding:0;margin:0"><b>Nombre:</b> ${Nombre}</h2>
         </td>
       </tr>


     <tr>
     <td style="padding-left: 20px; padding-right: 20px;" align="center" valign="top" class="mainTitle">
       <h2 class="text" style="color:#000;font-family:Poppins,Helvetica,Arial,sans-serif;font-size:14px;font-weight:100;font-style:normal;letter-spacing:normal;line-height:36px;text-transform:none;text-align:left;padding:0;margin:0"><b>Fecha de entrega:</b> ${tipo ===2?moment(form.ftur_ultima_actividad).format('DD-MM-YYYY'):moment().format('DD-MM-YYYY')}</h2>
     </td>
   </tr>

   <tr>
   <td style="padding-left: 20px; padding-right: 20px;" align="center" valign="top" class="mainTitle">
     <h2 class="text" style="color:#000;font-family:Poppins,Helvetica,Arial,sans-serif;font-size:14px;font-weight:100;font-style:normal;letter-spacing:normal;line-height:36px;text-transform:none;text-align:left;padding:0;margin:0"><b>Hora de entrega:</b> ${tipo ===2?moment(form.ftur_ultima_actividad).format('HH:mm'):moment().format('HH:mm')}</h2>
   </td>
 </tr>

   <tr>
   <td style="padding-left: 20px; padding-right: 20px;" align="center" valign="top" class="mainTitle">
     <h2 class="text" style="color:#000;font-family:Poppins,Helvetica,Arial,sans-serif;font-size:14px;font-weight:100;font-style:normal;letter-spacing:normal;line-height:36px;text-transform:none;text-align:left;padding:0;margin:0"><b>Lugar de entrega:</b> ${lugar}</h2>
   </td>
   </tr>
   <br/>
   <br/>
   <tr>
   <td style="padding-left: 20px; padding-right: 20px; margin: 50px;" align="center" valign="top" class="mainTitle">
   ${tableHTML}   
  </td>

 </tr>


 <tr>
                       <td style="padding-top: 7px;padding-left:20px"; padding-bottom: 7px; align="center"  class="imgHero">
                         <div>
                             <img alt="" border="0" src="cid:logo_gobm" width="70" height="auto" style="display:block;color: #f9f9f9;">
                         </div>
                       </td>
                     </tr>  
                    
                  
      
             <tr>
               <td style="font-size:1px;line-height:1px" height="20">&nbsp;</td>
             </tr>
             
           </tbody>
         </table>
         <table border="0" cellpadding="0" cellspacing="0" width="100%" class="space">
           <tbody>
             <tr>
               <td style="font-size:1px;line-height:1px" height="30">&nbsp;</td>
             </tr>
           </tbody>
         </table>
       </td>
     </tr>
   </tbody>
 </table>
 <table border="0" cellpadding="0" cellspacing="0" width="100%" class="wrapperFooter" style="max-width:600px">
   <tbody>
     <tr>
       <td align="center" valign="top">
         <table border="0" cellpadding="0" cellspacing="0" width="100%" class="footer">
           <tbody>
             
             <tr>
               <td style="padding: 10px 10px 5px;" align="center" valign="top" class="brandInfo">
                 <p class="text" style="color:#bbb;font-family:Open Sans,Helvetica,Arial,sans-serif;font-size:12px;font-weight:400;font-style:normal;letter-spacing:normal;line-height:20px;text-transform:none;text-align:center;padding:0;margin:0">©&nbsp; APPSGOBM - GERENCIA DE OBRAS MINAS</p>
               </td>
             </tr>

             <tr>
               <td style="padding: 0px 10px 10px;" align="center" valign="top" class="footerEmailInfo">
                 <p class="text" style="color:#bbb;font-family:Open Sans,Helvetica,Arial,sans-serif;font-size:12px;font-weight:400;font-style:normal;letter-spacing:normal;line-height:20px;text-transform:none;text-align:center;padding:0;margin:0">Este es un correo electrónico generado de forma automática; por favor no lo responda.</p>
               </td>
             </tr>
             <tr>
               <td style="font-size:1px;line-height:1px" height="15">&nbsp;</td>
             </tr>
           </tbody>
         </table>
       </td>
     </tr>
     <tr>
       <td style="font-size:1px;line-height:1px" height="30">&nbsp;</td>
     </tr>
   </tbody>
 </table>
</td>
</tr>
</tbody>
</table>
</body>
</html>`
  
  
  conector.query(sql2,(err2,result2)=>{
    if(err2) throw err2
    newMailer.enviarCorreo(correo,`Cambio de estado, solicitud de EPP numero:${insertId}` ,`${body}`,'')

  });


}

router.post("/insertReserva", async (req, res) => {
  const fecha = moment().format('YYYY-MM-DD hh:mm');
  const status = 3;
  const form =req.body.data.values.form
  const sql = "INSERT INTO epp_ccta_stock SET ?";
  const epp = req.body.data;
  const dataArray = req.body.data.DataEppAll.data;
  const insertId=req.body.data.DataEppAll.data[0].fk_solicitud


  try {
    const result=''
    for (const data of dataArray) {
     
      const compuesto = parseInt(data.epp_id.toString() +data.fk_sexo.toString() +data.fk_talla.toString());
      
      let datosArchivos = {
        fk_id_epp: data.epp_id,
        fk_id_talla: data.fk_talla,
        fk_id_sexo: data.fk_sexo,
        mov_epp_cant: data.can_reservada,
        mov_epp_fecha: fecha,
        fk_id_mov: req.body.data.values.form.tipo,
        rut_resp: data.rut_solicitante,
        id_comp: compuesto

      };

      await new Promise((resolve, reject) => {
        conector.query(sql, datosArchivos, (error, resultado) => {
          if (error) {
            reject(error);
          } else {
            resolve(resultado);

          }
        });
      });
    }
    res.status(200).json(1);
    updateEstadoSol(insertId, form, dataArray)
  } catch (error) {
    res.status(500).json({ error: "Error en las inserciones", details: error });
   
  }
});

router.post("/rechazaSolicitud", async (req, res) => {
  const fecha = moment().format('YYYY-MM-DD hh:mm');
  const status = 3;
  const form =req.body.data.values.form
  const sql = "INSERT INTO epp_ccta_stock SET ?";
  const epp = req.body.data;
 
  const dataArray = req.body.data.dataSolicitud.DataEppAll.data;
  const nombre=req.body.data.dataSolicitud.nomUser
  const user=  req.body.data.dataSolicitud.user

  const obs=req.body.data.values.form.obs_epp
const insertId=req.body.data.dataSolicitud.DataEppAll.data[0].fk_solicitud


const tableRows = dataArray.map(dataItem => {
  return `
  <tr>
     
      <td>${dataItem.des_epp}</td>
      <td>${dataItem.des_tal}</td>
      <td>${dataItem.des_sex}</td>
      <td>${dataItem.can_solicitada}</td>
     
     
    </tr>
  `;
});

const tableHTML = `
<div style="text-align: center;">
<table class="tech-table">
 <tr>
    
 <th>Elemento de protección personal</th>
 <th>Talla</th>
 <th>Sexo</th>
 <th>Solicitados</th>

</tr>
${tableRows.join('')}


</table>
</div>
`;
  const body = `
  <!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Document</title>
</head>
<style>
.tech-table {
    border-collapse: collapse;
    width: 50%;
    margin: 20px;
}

.tech-table th, .tech-table td {
    border: 1px solid #dddddd;
    text-align: left;
    padding: 8px;
    font-family: 'Calibri', sans-serif;
    white-space: nowrap; /* Evita que el texto se divida en varias líneas */
}

.tech-table th {
    background-color: #E55302;
    color: white;
    font-size: 16px;
   
    font-weight: bold;
    letter-spacing: 1px;
    height: 30px;
    max-height: 30px; /* Altura máxima para evitar que se agranden en Outlook */
}

.tech-table tr:nth-child(even) {
    background-color: #f2f2f2;
}

.tech-table tr:nth-child(odd) {
    background-color: #e6e6e6;
}
</style>
<body>
<!-- © 2022 Shift Technologies. All rights reserved. -->
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout:fixed;background-color:#f9f9f9" id="bodyTable">
<tbody>
<tr>
<td style="padding-right:10px;padding-left:10px;" align="center" valign="top" id="bodyCell">
 <table border="0" cellpadding="0" cellspacing="0" width="100%" class="wrapperBody" style="max-width:600px">
   <tbody>
     <tr>
       <td align="center" valign="top">
         <table border="0" cellpadding="0" cellspacing="0" width="100%" class="tableCard" style="background-color:#fff;border-color:#e5e5e5;border-style:solid;border-width:0 1px 1px 1px;">
           <tbody>
             <tr>
               <td style="background-color:#f47600;font-size:1px;line-height:3px" class="topBorder" height="3">&nbsp;</td>
             </tr>                    
             <tr>
               <td style="padding-bottom: 10px;" align="center" valign="middle" class="emailLogo">
                                         <h2 class="text" style="color:#000;font-family:Trebuchet MS, Lucida Sans Unicode, Lucida Grande, Lucida Sans, Arial, sans-serif;font-size:30px;font-weight:500;font-style:normal;letter-spacing:normal;line-height:36px;text-transform:none;text-align:center;padding:0;margin:0"><small>Cambio de estado en la solicitud de EPP</h2>
               </td>
             </tr>
              <tr>
               <td style="padding-bottom: 5px; padding-left: 20px; padding-right: 20px;" align="center" valign="top" class="mainTitle">
                 <h2 class="text" style="color:#000;font-family:Poppins,Helvetica,Arial,sans-serif;font-size:20px;font-weight:500;font-style:normal;letter-spacing:normal;line-height:36px;text-transform:none;text-align:center;padding:0;margin:0">Le informamos que su solicitud ha sido rechazada debido al siguiente motivo:</h2>
               </td>
             </tr> 
             <tr>
               <td style="padding-bottom: 30px; padding-left: 20px; padding-right: 20px;" align="center" valign="top" class="subTitle">
                 <h2 class="text" style="color:#999;font-family:Poppins,Helvetica,Arial,sans-serif;font-size:15px;font-weight:500;font-style:normal;letter-spacing:normal;line-height:30px;text-transform:none;text-align:center;padding:0;margin:0">${obs}</h2>
               </td>
             </tr>
             <tr>
             <td style="padding-left: 20px; padding-right: 20px;" align="center" valign="top" class="mainTitle">
               <h2 class="text" style="color:#000;font-family:Poppins,Helvetica,Arial,sans-serif;font-size:14px;font-weight:500;font-style:normal;letter-spacing:normal;line-height:36px;text-transform:none;text-align:left;padding:0;margin:0"><b>Número de solicitud:</b> ${insertId}</h2>
             </td>
           </tr>

   
           <tr>
   <td style="padding-left: 20px; padding-right: 20px;" align="center" valign="top" class="mainTitle">
      <h2 class="text" style="color:#000;font-family:Poppins,Helvetica,Arial,sans-serif;font-size:14px;font-style:normal;letter-spacing:normal;line-height:36px;text-transform:none;text-align:left;padding:0;margin:0; font-weight: normal;"><b>Rut:</b> ${user}</h2>
   </td>
</tr>

<tr>
   <td style="padding-left: 20px; padding-right: 20px;" align="center" valign="top" class="mainTitle">
      <h2 class="text" style="color:#000;font-family:Poppins,Helvetica,Arial,sans-serif;font-size:14px;font-style:normal;letter-spacing:normal;line-height:36px;text-transform:none;text-align:left;padding:0;margin:0; font-weight: normal;"><b>Nombre:</b> ${nombre}</h2>
   </td>
</tr>



<br/>
<br/>

         <tr>
         <td style="padding-left: 20px; padding-right: 20px; margin: 50px;" align="center" valign="top" class="mainTitle">
         ${tableHTML}   
      </td>
      
       </tr>

                       <td style="padding-top: 7px;padding-left:20px"; padding-bottom: 7px; align="center"  class="imgHero">
                         <div>
                             <img alt="" border="0" src="cid:logo_gobm" width="70" height="auto" style="display:block;color: #f9f9f9;">
                         </div>
                       </td>
                     </tr>  
             <tr>
               <td style="font-size:1px;line-height:1px" height="20">&nbsp;</td>
             </tr>
             
           </tbody>
         </table>
         <table border="0" cellpadding="0" cellspacing="0" width="100%" class="space">
           <tbody>
             <tr>
               <td style="font-size:1px;line-height:1px" height="30">&nbsp;</td>
             </tr>
           </tbody>
         </table>
       </td>
     </tr>
   </tbody>
 </table>
 <table border="0" cellpadding="0" cellspacing="0" width="100%" class="wrapperFooter" style="max-width:600px">
   <tbody>
     <tr>
       <td align="center" valign="top">
         <table border="0" cellpadding="0" cellspacing="0" width="100%" class="footer">
           <tbody>
             
             <tr>
               <td style="padding: 10px 10px 5px;" align="center" valign="top" class="brandInfo">
                 <p class="text" style="color:#bbb;font-family:Open Sans,Helvetica,Arial,sans-serif;font-size:12px;font-weight:400;font-style:normal;letter-spacing:normal;line-height:20px;text-transform:none;text-align:center;padding:0;margin:0">©&nbsp; APPSGOBM - GERENCIA DE OBRAS MINAS</p>
               </td>
             </tr>

             <tr>
               <td style="padding: 0px 10px 10px;" align="center" valign="top" class="footerEmailInfo">
                 <p class="text" style="color:#bbb;font-family:Open Sans,Helvetica,Arial,sans-serif;font-size:12px;font-weight:400;font-style:normal;letter-spacing:normal;line-height:20px;text-transform:none;text-align:center;padding:0;margin:0">Este es un correo electrónico generado de forma automática; por favor no lo responda.</p>
               </td>
             </tr>
             <tr>
               <td style="font-size:1px;line-height:1px" height="15">&nbsp;</td>
             </tr>
           </tbody>
         </table>
       </td>
     </tr>
     <tr>
       <td style="font-size:1px;line-height:1px" height="30">&nbsp;</td>
     </tr>
   </tbody>
 </table>
</td>
</tr>
</tbody>
</table>
</body>
</html>`


  const sql2 = `UPDATE epp_solicitud set status_solicitud = 4,  fec_hora_entrega ='${moment().format('YYYY-MM-DD HH:mm')}',  lugar_entrega_solicitud = 'Solicitud rechazada' where id =${insertId} `;
  conector.query(sql2,(err2,result2)=>{
    if(err2) throw err2
    res.status(200).json(1);
    newMailer.enviarCorreo(req.body.data.dataSolicitud.correo,`Cambio de estado, solicitud de EPP numero:${insertId}` ,`${body}`,'')

  });


});



module.exports = router;