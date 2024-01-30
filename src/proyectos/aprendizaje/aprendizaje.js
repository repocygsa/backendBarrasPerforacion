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


 router.post("/getPermisoSessionAprendizaje", (req, res) => {
  const datosSesion = req.body.res.data
  let rut= ""
  if (req.body.res.data.rut) {
    rut = req.body.res.data.rut
  }
 
  const sql = `select * from aprendizaje_usuarios where rut=?`;
    conector.query(sql,[rut], (err, result) => {
    if (err) throw err;
      res.status(200).json({permiso:result,datosSesion});
    })
})



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

  `;
  conector.query(sql, (err, result) => {
    if (err) throw err;
    res.status(200).json({ result });
  });

});

router.post("/getActividad", (req, res) => {

  const sql = `
  SELECT
  0 AS id,
  'Otra' AS nom,
  1 AS est

UNION
  SELECT
*
  FROM hal_seg_subact1
  WHERE est = 1
  order by id desc
  `;
  conector.query(sql, (err, result) => {
    if (err) throw err;
    res.status(200).json({ result });
  });

});

router.post("/getActividad2", (req, res) => {
const id = req.body.id !==''?req.body.id :0
const condicion =`AND fk_san_1 = ${id}`
  const sql = `
  SELECT
*
  FROM hal_seg_subact2
  WHERE est = 1
  ${condicion}
  `;
  conector.query(sql, (err, result) => {
    if (err) throw err;
    res.status(200).json({ result });
  });

});



router.post("/getActividad3", (req, res) => {
  const id = req.body.id !== '' ? req.body.id : 0;
  const nom = id !== 0 ? '' : 'no aplica';
  const condicion = `AND fk_san_2 = ${id}` ;
  const sql = `
    SELECT
      id,
      ${id !== 0 ? 'nom' : `'${nom}'`} as nom
    FROM hal_seg_subact3
    WHERE est = 1
    ${condicion}
  `;

  conector.query(sql, (err, result) => {
    if (err) throw err;

    // Verificar si result está vacío y devolver 0 si es así
    const data = result.length > 0 ? result : [{ id: 0, nom: 'no aplica' }];

    res.status(200).json({ result: data });
  });
});

router.post("/getActividad4", (req, res) => {
  const id = req.body.id !==''? req.body.id : 0;

  const nom = id !== 0 ? '' : 'no aplica';
  const condicion =  `AND fk_san_3 = ${id}`;
  const sql = `
    SELECT
      id,
      ${id !== 0 ? 'nom' : `'${nom}'`} as nom
    FROM hal_seg_subact4
    WHERE est = 1
    ${condicion}
  `;

  conector.query(sql, (err, result) => {
    if (err) throw err;

    // Verificar si result está vacío y devolver 0 si es así
    const data = result.length > 0 ? result : [{ id: 0, nom: 'no aplica' }];

    res.status(200).json({ result: data });
  });
});

router.post("/getIncidentesDet", (req, res) => {
  
  const id = req.body.data ;
  const nom = id !== 0 ? '' : 'no aplica';
  const condicion = `AND fk_id_incidente = ${id}` ;
  const sql = `
  SELECT
	gobm.inc_registro_detalle.id, 
	gobm.inc_registro_detalle.inc_det_fecha_cierre, 
	gobm.inc_registro_detalle.inc_med_correctiva, 
	gobm.inc_registro_detalle.inc_rut_responsable, 
	gobm.inc_registro_detalle.inc_det_estado, 
	gobm.inc_registro_detalle.inc_fec_cierre_real, 
	gobm.inc_registro_detalle.fk_id_incidente, 
  gobm.inc_registro_detalle.inc_obs, 
  DATEDIFF(NOW(), gobm.inc_registro_detalle.inc_det_fecha_cierre) AS dias_diferencia,
	tofitobd.DotacionCC.Nombre
FROM
	gobm.inc_registro_detalle
	INNER JOIN
	tofitobd.DotacionCC
	ON 
		gobm.inc_registro_detalle.inc_rut_responsable = tofitobd.DotacionCC.Rut
  where fk_ctto IS NULL
    ${condicion}
  `;

  conector.query(sql, (err, result) => {
    if (err) throw err;

    // Verificar si result está vacío y devolver 0 si es así
    const data = result.length > 0 ? result : [{ id: 0, nom: 'no aplica' }];

    res.status(200).json({ result: data });
  });
});

router.post("/getIncidentesTran", (req, res) => {
  

  const id = req.body.idCab
  const ctto = req.body.ctto
  const condicion = id >0?`AND grd.fk_id_incidente =${id}` :''


  const sql = `
  SELECT
  grd.id AS id, 
  grd.inc_det_fecha_cierre, 
  grd.inc_med_correctiva, 
  grd.inc_rut_responsable, 
  grd.inc_det_estado, 
  grd.inc_fec_cierre_real, 
  grd.fk_id_incidente, 
  grd.inc_obs, 
  grd.inc_complementada, 
  DATEDIFF(NOW(), grd.inc_det_fecha_cierre) AS dias_diferencia,
  dotacion.Nombre,
  (
    SELECT inc_det_estado
    FROM gobm.inc_registro_detalle subquery
    WHERE subquery.inc_det_id_comp = grd.id AND subquery.fk_ctto = ${ctto}
    LIMIT 1
  ) AS cerradas,
  (
    SELECT inc_complementada
    FROM gobm.inc_registro_detalle subquery
    WHERE subquery.inc_det_id_comp = grd.id AND subquery.fk_ctto = ${ctto}
    LIMIT 1
  ) AS estado_complemento
FROM
  gobm.inc_registro_detalle grd
INNER JOIN
  tofitobd.DotacionCC dotacion
ON 
  grd.inc_rut_responsable = dotacion.Rut
WHERE grd.fk_ctto IS NULL
${condicion}
ORDER BY  grd.fk_id_incidente ASC

  
  `;

  conector.query(sql, (err, result) => {
    if (err) throw err;

    res.status(200).json({ result});
  });
});

router.post("/getIncidentesArchDet", (req, res) => {
  
  const id = req.body.data ;
  const nom = id !== 0 ? '' : 'no aplica';
  const condicion = `AND fk_inc_detalle = ${id}` ;
  const sql = `
  SELECT
*
FROM
	gobm.inc_archivos_detalle
	
  where id > 0
    ${condicion}
  `;

  conector.query(sql, (err, result) => {
    if (err) throw err;

    // Verificar si result está vacío y devolver 0 si es así
    const data = result.length > 0 ? result : [{ id: 0, nom: 'no aplica' }];

    res.status(200).json({ result: data });
  });
});

router.post("/getIncidentesArch", (req, res) => {
  
  const id = req.body.data ;
  const nom = id !== 0 ? '' : 'no aplica';
  const condicion = `AND fk_inc_id = ${id}` ;
  const sql = `
  SELECT
*
FROM
	gobm.inc_archivos
	
  where id > 0
    ${condicion}
  `;

  conector.query(sql, (err, result) => {
    if (err) throw err;

    // Verificar si result está vacío y devolver 0 si es así
    const data = result.length > 0 ? result : [{ id: 0, nom: 'no aplica' }];

    res.status(200).json({ result: data });
  });
});

router.post("/getIncidentes", (req, res) => {

  const empresa = req.body.data.emp_inf ? req.body.data.emp_inf : '0';
  const ctto = req.body.data.ctt_inf ? req.body.data.ctt_inf : 'Todo';

  const bEmpresa = empresa !== '0' ? `AND gobm.inc_registro.fk_emp ='${req.body.data.emp_inf}' ` : '';
  const bCtto = ctto !== 'Todo' ? `AND gobm.inc_registro.fk_ctto ='${req.body.data.ctt_inf}' ` : '';
  const bTexto = req.body.data.pos_inf ? `AND gobm.inc_registro.inc_incidente like '%${req.body.data.pos_inf}%' ` : '';
  const bId = req.body.data.id? `AND gobm.inc_registro.id ='${req.body.data.id}' ` : '';

  
  const updateSql = `
      UPDATE gobm.inc_registro_detalle
      SET inc_det_estado = 2
      WHERE inc_det_fecha_cierre < CURRENT_DATE AND inc_det_estado <3;
  `;

  conector.query(updateSql, (err, updateResult) => {
      if (err) {
          throw err;
      }

      const selectSql = `
      SELECT
      gobm.inc_registro.id,
      gobm.inc_registro.fk_emp,
      gobm.tbl_empre.nom_empre,
      gobm.inc_registro.fk_ctto,
      gobm.inc_registro.fk_mina,
      gobm.rep_mina.nom AS nom_mina,
      gobm.inc_registro.fk_area,
      gobm.rep_area.nom AS nom_area,
      gobm.inc_registro.fk_nivel,
      gobm.rep_nivel.nom AS nom_nivel,
      gobm.inc_registro.inc_lugar,
      gobm.inc_registro.inc_fec_ocurrencia,
      gobm.inc_registro.inc_rut_lider,
      gobm.inc_registro.fk_actividad,
      gobm.hal_seg_subact1.nom AS actividad1,
      gobm.inc_registro.fk_actividad_2,
      gobm.hal_seg_subact2.nom AS actividad2,
      gobm.inc_registro.fk_actividad_3,
      gobm.hal_seg_subact3.nom AS actividad3,
      gobm.inc_registro.fk_actividad_4,
      gobm.hal_seg_subact4.nom AS actividad4,
      gobm.inc_registro.inc_incidente,
      gobm.inc_registro.inc_com_inv,
      gobm.inc_registro.inc_crea,
      gobm.inc_registro.inc_fecha_hora_registro,
      gobm.inc_registro.inc_estado,
      tofitobd.DotacionCC.Nombre AS lider,
      gobm.inc_registro.inc_ruta_archivo,
      gobm.inc_registro.inc_fecha_carga,
      gobm.inc_registro.inc_ruta_obs,
      gobm.inc_registro.inc_aprendizaje,
      gobm.inc_registro.inc_otra_actividad,
      inc_calificacion_incidente.cal_incidente_desc,
      inc_tipo_incidente.tip_inc_desc ,
			 gobm.inc_registro.inc_causas_principales,
			  gobm.inc_registro.inc_consecuencias,
			
				CONCAT( hal_seg_rc.cod_sigo, ' - ', hal_seg_rc.nom) AS concat_rc,
      DATEDIFF(NOW(), gobm.inc_registro.inc_fec_ocurrencia) AS dias_diferencia,
      -- Contar registros en inc_registro_detalle para esta cabecera
      (SELECT COUNT(*) FROM inc_registro_detalle WHERE fk_id_incidente = gobm.inc_registro.id) AS cuenta_detalle,
      -- Contar registros con inc_det_fecha_cierre mayor a la actual para esta cabecera
      (SELECT COUNT(*) FROM inc_registro_detalle WHERE fk_id_incidente = gobm.inc_registro.id AND inc_det_fecha_cierre > NOW()) AS cuenta_fecha_cierre,
      -- Contar registros en estado inc_det_estado=3 para esta cabecera
      (SELECT COUNT(*) FROM inc_registro_detalle WHERE fk_id_incidente = gobm.inc_registro.id AND inc_det_estado = 3) AS cuenta_estado,
      CONCAT(
        (SELECT COUNT(*) FROM inc_registro_detalle WHERE fk_id_incidente = gobm.inc_registro.id AND inc_det_estado = 3),
        ' de ',
        (SELECT COUNT(*) FROM inc_registro_detalle WHERE fk_id_incidente = gobm.inc_registro.id),
        ' (',
        (SELECT COUNT(*) FROM inc_registro_detalle WHERE fk_id_incidente = gobm.inc_registro.id And inc_det_estado <3 AND inc_det_fecha_cierre < CURRENT_DATE),
        ' atrasadas)'
    ) AS texto_resultado,
    -- Calcular porcentaje en base a cuenta_estado y cuenta_detalle
    CASE
        WHEN (SELECT COUNT(*) FROM inc_registro_detalle WHERE fk_id_incidente = gobm.inc_registro.id ) > 0 THEN
            ROUND((SELECT COUNT(*) FROM inc_registro_detalle WHERE fk_id_incidente = gobm.inc_registro.id AND inc_det_estado = 3 AND fk_ctto IS NULL) / (SELECT COUNT(*) FROM inc_registro_detalle WHERE fk_id_incidente = gobm.inc_registro.id) * 100, 2)
        ELSE
            0
    END AS porcentaje_estado_3
  FROM
      gobm.tbl_empre
      INNER JOIN gobm.inc_registro ON tbl_empre.rut_empre = inc_registro.fk_emp
      INNER JOIN gobm.rep_area ON gobm.inc_registro.fk_area = gobm.rep_area.id
      INNER JOIN gobm.rep_mina ON gobm.inc_registro.fk_mina = gobm.rep_mina.id
      INNER JOIN gobm.rep_nivel ON gobm.inc_registro.fk_nivel = gobm.rep_nivel.id
			LEFT JOIN hal_seg_rc ON gobm.inc_registro.fk_rc = gobm.hal_seg_rc.id
      LEFT JOIN gobm.hal_seg_subact1 ON gobm.inc_registro.fk_actividad = gobm.hal_seg_subact1.id
      LEFT JOIN gobm.hal_seg_subact2 ON gobm.inc_registro.fk_actividad_2 = gobm.hal_seg_subact2.id
      LEFT JOIN gobm.hal_seg_subact3 ON gobm.inc_registro.fk_actividad_3 = gobm.hal_seg_subact3.id
      LEFT JOIN gobm.hal_seg_subact4 ON gobm.inc_registro.fk_actividad_4 = gobm.hal_seg_subact4.id
      LEFT JOIN tofitobd.DotacionCC ON gobm.inc_registro.inc_rut_lider = tofitobd.DotacionCC.Rut
      LEFT JOIN inc_calificacion_incidente ON inc_registro.fk_cal_incidente = inc_calificacion_incidente.id
	LEFT JOIN inc_tipo_incidente ON inc_registro.fk_tip_incidente = inc_tipo_incidente.id
  WHERE gobm.inc_registro.id >= 0
  
          ${bEmpresa}
          ${bCtto}
          ${bTexto}
          ${bId}
          ORDER BY inc_registro.inc_fecha_hora_registro DESC;
      `;

      conector.query(selectSql, (err, selectResult) => {
          if (err) {
              throw err;
          }

          res.status(200).json({ result: selectResult });
      });
  });
});


router.post("/getTipoIncidente", (req, res) => {
  // act empresa = 1   consultar
    const sql = `
 
    SELECT
   *
    FROM inc_tipo_incidente
  
    `;
    conector.query(sql, (err, result) => {
      if (err) throw err;
      res.status(200).json({ result });
    });
  
  });

  router.post("/getCalIncidente", (req, res) => {
    // act empresa = 1   consultar
      const sql = `
   
      SELECT
     *
      FROM inc_calificacion_incidente
    
      `;
      conector.query(sql, (err, result) => {
        if (err) throw err;
        res.status(200).json({ result });
      });
    
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
  
  

  router.post('/getContratosEmpresa',(req,res)=>{
  
    const empre = req.body.datos;
  
    sql = `
    SELECT
    tofitobd.DotacionCC.Empresa, 
    tofitobd.DotacionCC.Contrato, 
    tofitobd.DotacionCC.Gerencia, 
    CONCAT(tofitobd.DotacionCC.Empresa, ' - ', tofitobd.DotacionCC.Contrato) AS resultConcat
  FROM
  tofitobd.DotacionCC
  WHERE
  tofitobd.DotacionCC.Gerencia ='GOBM'
  GROUP BY
  tofitobd.DotacionCC.Contrato
  ORDER BY
    resultConcat ASC
    
    `;
    conector.query(sql, [empre], (error,result)=>{
      if(error) throw error;        
      res.status(200).json({result})
    })
      
  });

  router.post('/getTranversalOLD',(req,res)=>{
  
    const empre = req.body.datos;
  
    sql = `
    SELECT
    gobm.inc_registro_tranversal.id,
    gobm.tbl_ctto.emp_ctto ,
    gobm.inc_registro_tranversal.fk_ctto,
    gobm.inc_registro_tranversal.fk_id_incidente,
    gobm.inc_registro_tranversal.fk_id_incidente_detalle,
    gobm.inc_registro_detalle.inc_med_correctiva,
    gobm.inc_registro_tranversal.inc_tran_estado,
    gobm.inc_registro_tranversal.inc_fec_cierre,
    gobm.inc_registro_tranversal.inc_obs_cierre,
    gobm.inc_registro_tranversal.fk_rut_responsable,
    gobm.inc_registro_tranversal.fk_tran_jerarquia,
    gobm.hal_seg_jerarquia.nom AS jerarquia,
    gobm.inc_registro_tranversal.inc_tran_user,
    tofitobd.dotacioncc.Nombre,
    DATEDIFF(NOW(), gobm.inc_registro_tranversal.inc_fec_cierre) AS dias_diferencia,
    gobm.tbl_empre.nom_empre 
  FROM
    gobm.inc_registro_tranversal
    INNER JOIN gobm.tbl_ctto ON gobm.inc_registro_tranversal.fk_ctto = gobm.tbl_ctto.num_ctto
    INNER JOIN gobm.inc_registro_detalle ON gobm.inc_registro_tranversal.fk_id_incidente_detalle = gobm.inc_registro_detalle.id
    INNER JOIN gobm.hal_seg_jerarquia ON gobm.inc_registro_tranversal.fk_tran_jerarquia = gobm.hal_seg_jerarquia.id
    INNER JOIN tofitobd.dotacioncc ON gobm.inc_registro_tranversal.fk_rut_responsable = tofitobd.dotacioncc.Rut
    INNER JOIN gobm.tbl_empre ON gobm.tbl_ctto.emp_ctto = gobm.tbl_empre.rut_empre
    `;
    conector.query(sql, [empre], (error,result)=>{
      if(error) throw error;        
      res.status(200).json({result})
    })
      
  });





    router.post('/getTranversal',(req,res)=>{
  
      const empre = req.body.datos;
    
      sql = `
      SELECT
      gobm.inc_registro_detalle.id, 
      gobm.inc_registro_detalle.inc_det_fecha_cierre, 
      gobm.inc_registro_detalle.inc_med_correctiva, 
      gobm.inc_registro_detalle.inc_rut_responsable, 
      gobm.inc_registro_detalle.inc_det_estado, 
      gobm.inc_registro_detalle.inc_fec_cierre_real, 
      gobm.inc_registro_detalle.fk_id_incidente, 
      gobm.inc_registro_detalle.inc_obs, 
      gobm.inc_registro_detalle.fk_ctto, 
      gobm.hal_seg_jerarquia.nom AS jerarquia,
      gobm.tbl_empre.nom_empre,
      DATEDIFF(NOW(), gobm.inc_registro_detalle.inc_det_fecha_cierre) AS dias_diferencia,
      tofitobd.DotacionCC.Nombre
    FROM
      gobm.inc_registro_detalle
      INNER JOIN
      tofitobd.DotacionCC
      ON 
        gobm.inc_registro_detalle.inc_rut_responsable = tofitobd.DotacionCC.Rut
        INNER JOIN gobm.tbl_ctto ON gobm.inc_registro_detalle.fk_ctto = gobm.tbl_ctto.num_ctto
        INNER JOIN gobm.hal_seg_jerarquia ON gobm.inc_registro_detalle.fk_jerarquia = gobm.hal_seg_jerarquia.id
        INNER JOIN gobm.tbl_empre ON gobm.tbl_ctto.emp_ctto = gobm.tbl_empre.rut_empre
      WHERE fk_ctto IS NOT NULL
      `;
      conector.query(sql, [empre], (error,result)=>{
        if(error) throw error;        
        res.status(200).json({result})
      })
        
    });

  router.post('/getTranversalId',(req,res)=>{
  

    const id = req.body.data;
    sql = `
    SELECT
    tbl_ctto.num_ctto,
    tbl_ctto.emp_ctto,
    inc_registro.inc_incidente,
    inc_registro_detalle.inc_med_correctiva,
    tbl_empre.nom_empre,
    inc_registro_tranversal.id,
    inc_registro_detalle.id AS id_cab,
    inc_registro_tranversal.inc_tran_estado,
    inc_registro_tranversal.inc_fec_cierre,
    inc_registro_tranversal.inc_obs_cierre 
  FROM
    inc_registro_tranversal
    INNER JOIN tbl_ctto ON inc_registro_tranversal.fk_ctto = tbl_ctto.num_ctto
    INNER JOIN inc_registro ON inc_registro_tranversal.fk_id_incidente = inc_registro.id
    INNER JOIN inc_registro_detalle ON inc_registro_tranversal.fk_id_incidente_detalle = inc_registro_detalle.id
    INNER JOIN tbl_empre ON tbl_ctto.emp_ctto = tbl_empre.rut_empre
  Where 
  inc_registro_tranversal.fk_id_incidente =${id}
  ORDER BY
    id_cab ASC
    `;
    conector.query(sql, (error,result)=>{
      if(error) throw error;        
      res.status(200).json({result})
    })
      
  });

  router.post('/eliminarAccionTranversal',(req,res)=>{
  

    const id = req.body.data.id;
    const obs = req.body.data.mant_obs;
    sql = `
   
    UPDATE inc_registro_detalle SET inc_det_estado = 4, inc_obs ='${obs}',  inc_complementada = 3, inc_fec_cierre_real='${moment().format('YYYY-MM-DD HH:mm')}'
    WHERE 
    inc_registro_detalle.id =${id}
    `;
    conector.query(sql, (error,result)=>{
      if(error) throw error;        
      res.status(200).json({result})
      setLog(id, id, '17.526.007-2', obs)
    })
      
  });

  router.post('/getCorrectivaId',(req,res)=>{
  

    const id = req.body.data;
    
    sql = `
    SELECT * FROM inc_registro_detalle WHERE id = ${id}
    `;
    conector.query(sql, (error,result)=>{
      if(error) throw error;        
      res.status(200).json({result})
    })
      
  });

 

  


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




  router.post('/getPersona',(req,res)=>{

 
    const rutp = req.body.rut;


            sql = `
            SELECT * 
			FROM tofitobd.DotacionCC dcc
            WHERE Rut = ?
            `;
            conector.query(sql, [rutp], (error,result)=>{
                if(error) throw error;        
                res.status(200).json({result})
            })
});

router.post('/getCorreosFlash',(req,res)=>{

 
  const rutp = req.body.rut;


          sql = `
          SELECT * 
    FROM gobm.inc_correos
          WHERE est = 1
          `;
          conector.query(sql, [rutp], (error,result)=>{
              if(error) throw error;        
              res.status(200).json({result})
          })
      
  

});

router.post('/getJerarquia',(req,res)=>{
          sql = `
          SELECT
          hal_seg_jerarquia.*
        FROM
          hal_seg_jerarquia
          `;
          conector.query(sql, (error,result)=>{
              if(error) throw error;        
              res.status(200).json({result})
          })

});

router.post('/getRiesgoCritico',(req,res)=>{

  sql = `
  
  SELECT
  0 AS id,
  NULL AS cod_sigo,
  NULL AS nom,
  'No aplica' AS resultConcat

UNION

SELECT
  id,
  cod_sigo,
  nom,
  CONCAT(cod_sigo, ' - ', nom) AS resultConcat
FROM
  hal_seg_rc;





  `;
  conector.query(sql, (error,result)=>{
      if(error) throw error;        
      res.status(200).json({result})
  })

});


router.post('/getCantidadId',(req,res)=>{
  
 
  sql = `
  SELECT id AS numero_id
  FROM inc_registro
  ORDER BY id DESC
  LIMIT 1;
  `
  conector.query(sql, (error,result)=>{
  if(error) throw error;        
    res.status(200).json({result})
  })

});




/*
 const envioFlashSeguridad=(insertId, valores, accCorrectivaConcatenada,tipoIncidenteDesc, empresa, fileImg, calificaIncidenteDesc, accCorreos)=>{
  
  const incidenteFolder = `Incidente_${valores.ctt_inf}`;
  const imgPath = `${pathDocument}/${incidenteFolder}/img_${valores.pos_inf}_folio-${insertId}/${fileImg}`;

  const attachments = [
    {
      filename: "logoGom.png",
      // path: `${process.env.PATH_DOCUMENT_CARTA_LORO}/src/Mail/images/fotoArchivos.png`,
      path: `${process.env.PATH_DOCUMENT_APE}/src/Mail/MailTemplates/docu_trabajadores/img/logoGom.png`,
      cid: "logoGom",
    },
    {
      filename: "logo_codelco.png",
      // path: `${process.env.PATH_DOCUMENT_CARTA_LORO}/src/Mail/images/fotoArchivos.png`,
      path: `${process.env.PATH_DOCUMENT_APE}/src/Mail/MailTemplates/docu_trabajadores/img/logo_codelco.png`,
      cid: "logo_codelco",
    },
    {
      filename: fileImg,
      // path: `${process.env.PATH_DOCUMENT_CARTA_LORO}/src/Mail/images/fotoArchivos.png`,
      path: `${utf8.decode(imgPath)}`,
      cid: "file_img",
    },
  ]
    
  const body = `
  <!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Reporte de Incidente</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
<style>
body {
  font-family: 'Arial', sans-serif;
  background-color: #f4f6f9; 
  color: #37474f; 
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;

}

.card {
  max-width: 800px;
  width: 100%;
  background-color: #fff; 
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid #e1e8ed; 
  margin-bottom: 20px;
}

.card-body {
  padding: 20px;
}

.banner {
  background-color: #3498db; 
  color: #fff; 
  text-align: center;
  padding: 10px;
  border-radius: 5px 5px 0 0;
}



.section-card {
  flex: 1;
  min-width: 200px; 
  background-color: #e1e8ed; 
  color: #37474f; 
 
  padding: 15px;
  margin-bottom: 5px;
}

.section-card2 {
  background-color: #e1e8ed; 
  color: #37474f; 
  border-radius: 5px;
  padding: 10px;
  margin-bottom: 15px;
  min-width: 120px;
  
}

.icon {
  font-size: 24px;
  margin-right: 10px;
  color: #3498db; 
}

label {
  display: block;
  margin-bottom: 5px;
  color: #546e7a;
}

p {
  margin: 0 0 10px;
}

.info-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-bottom: 15px;
  border-radius: 10px;
}


.info-row2 {

 
  border-radius: 5px;
      background-color: #e1e8ed;
      margin-bottom: 15px;
}

button {
  background-color: #3498db; 
  color: #fff; 
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #2980b9; 
}

.email-content {
  margin-top: 20px;
  font-size: 16px;
}
.informe img {
  max-width: '100%';
  width:'100%';
  margin-right: 5px;
  vertical-align: middle;
}

.email-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #3498db; 
}

.banner img {
  max-width: 150px;
  margin-right: 5px;
  vertical-align: middle;
}



.title {
  flex-grow: 1; 
  text-align: center;
  background-color: #3498db; 
  padding: 10px; 
  color: #fff;
}

.half-width {
  width: 50%;
  box-sizing: border-box;
}

.full-width {
  width: 100%;
  box-sizing: border-box;
}



</style>
</head>
<body>

<div class="card">
<div class="email-container">
<div class="banner">
  <img alt="" border="0" src="cid:logo_codelco" width="90" height="auto" style="display:block;color: #f9f9f9;">
</div>

<div class="title">
  <h1>Aprendizajes de Incidentes GOM</h1>
</div>

<div class="banner">
<img alt="" border="0" src="cid:logoGom" width="100" height="auto" style="display:block;color: #f9f9f9;">
</div>
</div>
  <div class="card-body">
    <div class="info-row">
      <div class="section-card">
      <h3>🏢<i class="email-content"></i> Empresa</h3>
       
        <p>${empresa}</p>
      </div>

      <div class="section-card">
      <h3>📅<i class="email-content"></i> Fecha y Hora</h3>
       
        </p>
      </div>

      <div class="section-card">
      <h3>📌<i class="email-content"></i> Lugar</h3>
        
        <p>${valores.pos_inf}</p>
      </div>
    </div>

    <div class="info-row">
    
    <div class="section-card" ;>
    <h3>⛏️<i class="email-content"></i> Mina</h3>
     
      <p>${valores.minaIncidenteDesc}</p>
    </div>
    <div class="section-card">
    <h3>🔸<i class="email-content"></i> Área</h3>
     
      <p>${valores.areaIncidenteDesc}</p>
    </div>
    <div class="section-card">
    <h3>🔹<i class="email-content"></i> Nivel</h3>
     
      <p>${valores.nivelIncidenteDesc}</p>
    </div>

   
  </div>

  <div class="info-row" style="display: flex; justify-content: space-between; text-align: left;">
    
  <div class="section-card" >
    <h3>⚠️<i class="email-content"></i> Tipo de Incidente</h3>
    <p>${tipoIncidenteDesc}</p>
  </div>

  <div class="section-card">
    <h3>🖊️<i class="email-content"></i> Calificación del Evento</h3>
    <p>${valores.calificaIncidenteDesc}</p>
  </div>
 
  
</div>





    <div class="info-row" style="display: flex; justify-content: space-between;">
    <div class="section-card" style="width: 48%; text-align: justify;">
      <h3>💿<i class="email-content"></i> ¿Qué Sucedió?</h3>
     
      <p>${valores.incidente}</p>
    </div>
    <div class="section-card" style="width: 48%;">
      <img alt="" border="0" src="cid:file_img" width="100%">
    </div>
  </div>

  <div class="info-row" style="display: flex; justify-content: space-between; text-align: left;">
    

  <div class="section-card">
    <h3>⛔<i class="email-content"></i> Riesgo crítico</h3>
    <p>${valores.rcDesc}</p>
  </div>
 

</div>

  <div class="info-row" style="display: flex; justify-content: space-between; text-align: left;">
    
  <div class="section-card" >
    <h3>🚫<i class="email-content"></i> Causas principales</h3>
    <p>${valores.inc_causas_principales}</p>
  </div>

  <div class="section-card">
    <h3>🛑<i class="email-content"></i> Consecuencias</h3>
    <p>${valores.inc_consecuencias}</p>
  </div>
 

</div>
<div class="info-row" style="display: flex; justify-content: space-between; text-align: left;">
    <div class="section-card">
    <h3>📑<i class="email-content"></i> Acciones Correctivas</h3>
     
      <p>${accCorrectivaConcatenada}</p>
    </div>
</div>
<div class="info-row" style="display: flex; justify-content: space-between; text-align: left;">
    <div class="section-card">
    <h3>💡<i class="email-content"></i> Aprendizaje</h3>
      <label>Control critico ausente o fallido (en eventos significativos):</label>
      <p>${valores.inc_aprendizaje}</p>
    </div>
</div>
  </div>
</div>

</body>
</html>


  
  `  
  const sql2 = `UPDATE inc_registro set inc_estado_flash = 1 where id =${insertId} `;
  
  
  conector.query(sql2,(err2,result2)=>{
    if(err2) throw err2
    newMailer.enviarCorreo(`
    ${accCorreos}
    `,
    `Aprendizaje de incidente GOM ` ,
    `${body}`,attachments)

  });


}

*/





const buscarCorreos=()=>{
  return new Promise(res=>{
    let sql=`
    SELECT correo 
    FROM inc_correos
    WHERE est = 1
    `
    conector.query(sql, (err, result) => {
      if (err) throw err;
        res(result)
    });
  })
}


const envioCorreo = async()=>{

  let attachments = [
    {
      filename: 'reporte.png',
      path: `${process.env.PATH_DOCUMENT_APE}/reportes/reporte.png`,
      cid: "reporte",
    }
  ]

  const plantilla = planti.setBody()

  const correosAEnviar = await buscarCorreos()
  let listaCorreos=[]  // acá se almacenan los correos de los administradores para ser enviados

  correoVerificacion = 'randr014@contratistas.codelco.cl'

  correosAEnviar.map(correoReporte=>{
    listaCorreos.push(correoReporte.correo)
  })

  newMailer.enviarCorreo(correoVerificacion, listaCorreos,'Aprendizaje de incidente GOM', plantilla, attachments)

};




  

const insertarDetalleIncidente = (insertId, valArray) => {
  valArray.forEach(corr => {
      const sql2 = 'INSERT INTO inc_registro_detalle (fk_id_incidente, inc_det_fecha_cierre, inc_med_correctiva, inc_rut_responsable, inc_det_estado, inc_fec_cierre_real, inc_det_reporte, fk_jerarquia, inc_complementada) VALUES (?, ?, ?, ?,?,?,?,?,?)';
      conector.query(sql2, [insertId, corr.fec_cierre, corr.acc_correctiva, corr.rut_responsable,  1, moment().format('YYYY-MM-DD'), corr.isReport, corr.fk_jerarquia, 1], (err2, result2) => {
          if (err2) {
              throw err2;
          } else {
              const nuevoInsertId = result2.insertId;
              if (corr.contratos && corr.contratos.length > 0) {
             // insertarTranversal(insertId, nuevoInsertId,corr.contratos)
              }
              // Aquí puedes hacer algo con el nuevo insertId
          }
      });
  });
}







const insertarArchIncidente=(insertId, valArch)=>{

valArch.forEach(corr => {


    const sql2 = 'INSERT INTO inc_archivos (fk_inc_id, inc_arch_fecha, inc_arch_ruta,inc_arch_nom) VALUES (?, ?, ?,?)';
    conector.query(sql2,[insertId, moment().format('YYYY-MM-DD HH:mm') ,corr.path, corr.originalname],(err2,result2)=>{
      if(err2) throw err2
    });

  });
  
}

const insertarArchIncidenteDet=(insertId, valArch)=>{

  valArch.forEach(corr => {
  
     
  
      const sql2 = 'INSERT INTO inc_archivos_detalle (fk_inc_detalle, inc_arch_det_fecha, inc_arch_det_ruta, inc_arch_det_nom) VALUES (?, ?, ?,?)';
      conector.query(sql2,[insertId, moment().format('YYYY-MM-DD HH:mm'),corr.path, corr.filename],(err2,result2)=>{
        if(err2) throw err2
      });
  
    });
    
  }

  const insertarTranversal=(insertId,insertIdDet, valCtto)=>{

    valCtto.forEach(corr => {
        const sql2 = 'INSERT INTO inc_registro_tranversal (fk_emp, fk_ctto, fk_id_incidente, fk_id_incidente_detalle, inc_tran_estado) VALUES (?, ?, ?,?,?)';
        conector.query(sql2,[0, corr,insertId, insertIdDet,0],(err2,result2)=>{
          if(err2) throw err2
          
        });
    
      });
      
    }

   
    router.post('/AgregarAccionTranversalRespaldo', async (req, res) => {

      
      const id_incidente = req.body.data.id_incidente
      const id_medida= req.body.data.id_medida
      const usuario = req.body.data.usuario.usuario
      const responsable= req.body.data.rut_usu
      const fec_cierre= req.body.data.fec_cierre
      const fk_jerarquia= req.body.data.fk_jerarquia
      const valCtto = req.body.data.contratos_cst;
     
      
    

        valCtto.forEach(corr => {
          const sql2 =
          'INSERT INTO inc_registro_tranversal (fk_emp, fk_ctto, fk_id_incidente, fk_id_incidente_detalle, inc_tran_estado,inc_fec_cierre, inc_obs_cierre, fk_rut_responsable, fk_tran_jerarquia, inc_tran_user) VALUES (?, ?, ?,?,?,?,?,?,?,?)';
        
          conector.query(
            sql2,
            [0, corr, id_incidente, id_medida, 1,fec_cierre,'', responsable,fk_jerarquia, usuario],
            (err, result) => {
              if (err) reject(err);
              res.status(200).json({ result });
            }
          );
      
        });
    
        
    
    });


    const updateAccionId=(id)=>{
      sql = `
     UPDATE inc_registro_detalle SET inc_complementada = 2 WHERE id = ${id}
      `;
      conector.query(sql, (error,result)=>{
        if(error) throw error;        
        
      })
      
        
      }

      const deleteTranId=(id, idDet, ctto)=>{
        sql = `
       DELETE FROM inc_registro_detalle   WHERE inc_det_id_comp =${idDet} AND fk_ctto =${ctto}
        `;
        conector.query(sql, (error,result)=>{
          if(error) throw error;        
          
        })
        
          
        }


        const setLog=(id, idDet, user, text)=>{
          sql = `
         INSERT INTO inc_log (inc_log_movimiento, inc_log_id_cab, inc_log_id_detalle, inc_log_user, inc_log_fecha) VALUES('${text}', ${id}, ${idDet}, '${user}', '${moment().format('YYYY-MM-DD HH:mm')}')
          `;
          conector.query(sql, (error,result)=>{
            if(error) throw error;        
            
          })
          
            
          }

    router.post('/AgregarAccionTranversalOLD', async (req, res) => {
      const id_incidente = req.body.data.id_incidente;
      const id_medida = req.body.data.id_medida;
      const usuario = req.body.data.usuario.usuario;
      const responsable = req.body.data.rut_usu;
      const fec_cierre = req.body.data.fec_cierre;
      const fk_jerarquia = req.body.data.fk_jerarquia;
      const valCtto = req.body.data.contratos_cst;
    
    
    
      // Crear una función que devuelve una promesa para la inserción de un contrato
      const insertContrato = (corr) => {
        return new Promise((resolve, reject) => {
          const sql2 =
            'INSERT INTO inc_registro_tranversal (fk_emp, fk_ctto, fk_id_incidente, fk_id_incidente_detalle, inc_tran_estado, inc_fec_cierre, inc_obs_cierre, fk_rut_responsable, fk_tran_jerarquia, inc_tran_user) VALUES (?, ?, ?,?,?,?,?,?,?,?)';
    
          conector.query(
            sql2,
            [0, corr, id_incidente, id_medida, 1, fec_cierre, '', responsable, fk_jerarquia, usuario],
            (err, result) => {
              if (err) reject(err);
              resolve(result);
            }
          );
        });
      };
    
      try {
        // Utilizar Promise.all para ejecutar todas las inserciones de forma concurrente

        const result = await Promise.all(valCtto.map(insertContrato));
        updateAccionId(id_medida)
        // Enviar la respuesta después de que todas las inserciones se completen
        res.status(200).json({ result });
      //  res.status(200).json({ result });
      } catch (error) {
        // Manejar errores
        console.error(error);
        res.status(500).json({ error: 'Error al realizar las inserciones.' });
      }
    });


    router.post('/AgregarAccionTranversal', async (req, res) => {
      const id_incidente = req.body.data.id_incidente;
      const id_medida = req.body.data.id_medida;
      const usuario = req.body.data.usuario.usuario;
      const responsable = req.body.data.rut_usu;
      const fec_cierre = req.body.data.fec_cierre;
      const fk_jerarquia = req.body.data.fk_jerarquia;
      const valCtto = req.body.data.contratos_cst;
      const medidaCorrDesc =req.body.data.medidaCorrDesc;
    
      deleteTranId(id_incidente, id_medida, valCtto)
      // Crear una función que devuelve una promesa para la inserción de un contrato
      const insertContrato = (corr) => {
        return new Promise((resolve, reject) => {
          const sql2 =
            'INSERT INTO inc_registro_detalle (fk_id_incidente, inc_det_fecha_cierre, inc_med_correctiva, inc_rut_responsable, inc_det_estado, inc_fec_cierre_real, inc_det_reporte, fk_jerarquia, inc_complementada,fk_ctto, inc_det_user, inc_det_id_comp) VALUES (?,?, ?, ?, ?,?,?,?,?,?,?,?)';
          conector.query(
            sql2,
            [ id_incidente,fec_cierre ,medidaCorrDesc ,responsable,1 , moment().format('YYYY:MM:DD'), 0, fk_jerarquia,2,corr ,usuario, id_medida],
            (err, result) => {
              if (err) reject(err);
              resolve(result);
            }
          );
        });
      };
    
      try {
        // Utilizar Promise.all para ejecutar todas las inserciones de forma concurrente

        const result = await Promise.all(valCtto.map(insertContrato));
        updateAccionId(id_medida)
        setLog(id_incidente, id_medida, '17.526.007-2', 'Inserción de medida a tranversalización')
        // Enviar la respuesta después de que todas las inserciones se completen
        res.status(200).json({ result });
      //  res.status(200).json({ result });
      } catch (error) {
        // Manejar errores
        console.error(error);
        res.status(500).json({ error: 'Error al realizar las inserciones.' });
      }
    });
    

    
    
    
    


    router.post('/getContratosCst',(req,res)=>{
     
      const rut = req.body.data.usuario
      const id = req.body.data.idCab ?req.body.data.idCab:2
    
    
      bCst=rut?`AND inc_cst_contratos.fk_cst_rut = '${rut}'`:''
    
          sql = `
          SELECT
          inc_cst_contratos.id,
          inc_cst_contratos.fk_cst_ctto,
          inc_cst_contratos.fk_cst_rut,
          tbl_ctto.emp_ctto,
          tbl_ctto.nom_ctto,
          tbl_empre.nom_empre,
          tofitobd.dotacioncc.Nombre,
          (
            SELECT COUNT(*)
            FROM inc_registro_detalle
            WHERE fk_id_incidente = ${id} AND fk_ctto IS NULL
          ) AS count_id_1,
          (
            SELECT COUNT(*)
            FROM inc_registro_detalle
            WHERE fk_ctto = inc_cst_contratos.fk_cst_ctto AND fk_id_incidente = ${id} AND inc_complementada = 3
          ) AS count_complementada_3,

          (
            SELECT COUNT(*)
            FROM inc_registro_detalle
            WHERE fk_ctto = inc_cst_contratos.fk_cst_ctto AND fk_id_incidente = ${id} AND inc_complementada = 2
          ) AS count_complementada_2,

          (
            SELECT COUNT(*)
            FROM inc_registro_detalle
            WHERE fk_ctto = inc_cst_contratos.fk_cst_ctto AND fk_id_incidente = ${id} AND inc_complementada = 2 AND inc_det_estado=3
          ) AS count_cerradas
        FROM
          inc_cst_contratos
        INNER JOIN
          tbl_ctto ON inc_cst_contratos.fk_cst_ctto = tbl_ctto.num_ctto
        INNER JOIN
          tbl_empre ON tbl_ctto.emp_ctto = tbl_empre.rut_empre
          INNER JOIN tofitobd.dotacioncc ON gobm.inc_cst_contratos.fk_cst_rut = tofitobd.dotacioncc.Rut 
        WHERE inc_cst_contratos.id > 0
        
          ${bCst}
          `
          conector.query(sql, (error,result)=>{
          if(error) throw error;        
            res.status(200).json({result})
          })
        
        });


        router.post('/getContratosCstGen',(req,res)=>{

   

          
          const empresa = req.body.data.emp_inf ? req.body.data.emp_inf : '0';
          const ctto = req.body.data.ctt_inf ? req.body.data.ctt_inf : 'Todo';
        
          const bEmpresa = empresa !== '0' ? `AND gobm.tbl_ctto.emp_ctto ='${req.body.data.emp_inf}' ` : '';
          const bCtto = ctto !== 'Todo' ? `AND gobm.inc_cst_contratos.fk_cst_ctto ='${req.body.data.ctt_inf}' ` : '';
          const bTexto = req.body.data.pos_inf ? `AND gobm.inc_registro.inc_incidente like '%${req.body.data.pos_inf}%' ` : '';
          const bId = req.body.data.id? `AND gobm.inc_registro.id ='${req.body.data.id}' ` : '';
          
        
              sql = `
              SELECT
              gobm.inc_registro.id AS idCab,
              gobm.inc_registro.inc_incidente,
              gobm.inc_registro.inc_lugar,
              gobm.inc_registro.inc_aprendizaje,
              gobm.inc_cst_contratos.id,
              gobm.inc_cst_contratos.fk_cst_ctto,
              gobm.inc_cst_contratos.fk_cst_rut,
              gobm.tbl_ctto.emp_ctto,
              gobm.tbl_ctto.nom_ctto,
              gobm.tbl_empre.nom_empre,
              ( SELECT COUNT(*) FROM inc_registro_detalle WHERE fk_id_incidente = idCab AND fk_ctto IS NULL ) AS count_id_1,
              ( SELECT COUNT(*) FROM inc_registro_detalle WHERE fk_ctto = inc_cst_contratos.fk_cst_ctto AND fk_id_incidente = idCab AND inc_complementada = 3 ) AS count_complementada_3,
              ( SELECT COUNT(*) FROM inc_registro_detalle WHERE fk_ctto = inc_cst_contratos.fk_cst_ctto AND fk_id_incidente = idCab AND inc_complementada = 2 ) AS count_complementada_2,
              ( SELECT COUNT(*) FROM inc_registro_detalle WHERE fk_ctto = inc_cst_contratos.fk_cst_ctto AND fk_id_incidente = idCab AND inc_complementada = 2 AND inc_det_estado = 3 ) AS count_cerradas,
              tofitobd.dotacioncc.Nombre,
              CONCAT(gobm.inc_registro.id, '_', gobm.inc_cst_contratos.fk_cst_rut,'_',gobm.inc_cst_contratos.fk_cst_ctto) AS idGrid
            FROM
              gobm.inc_registro,
              gobm.inc_cst_contratos
              INNER JOIN gobm.tbl_ctto ON inc_cst_contratos.fk_cst_ctto = tbl_ctto.num_ctto
              INNER JOIN gobm.tbl_empre ON tbl_ctto.emp_ctto = tbl_empre.rut_empre
              INNER JOIN tofitobd.dotacioncc ON gobm.inc_cst_contratos.fk_cst_rut = tofitobd.dotacioncc.Rut 
           WHERE  gobm.inc_cst_contratos.id > 0
           
           ${bEmpresa}
           ${bCtto}
           ${bTexto}

            ORDER BY
            idCab ASC,
              fk_cst_rut ASC
              
          
              `
              conector.query(sql, (error,result)=>{
              if(error) throw error;        
                res.status(200).json({result})
              })
            
            });
    

    router.post('/getDescartaAcc',(req,res)=>{
 
      const idDet = req.body.data.datos.id;
      const id= req.body.data.datos.fk_id_incidente
      const ctto = req.body.data.ctto
      const usuario = req.body.data.usuario
      deleteTranId(id, idDet, ctto)
      const sql2 =
      'INSERT INTO inc_registro_detalle (fk_id_incidente, fk_ctto, inc_det_id_comp,inc_complementada ) VALUES (?,?,?,?)';
    conector.query(
      sql2,
      [ id,ctto , idDet,3],
      (err, result) => {
        if (err) reject(err);

        res.status(200).json({result})
        setLog(id, idDet, '17.526.007-2', 'Medida queda en estado N/A')
      }
    );

      
        
    });

/*  function generarListaHTML(valoresArray) {
    const accCorrectivaArray = valoresArray
      .filter(item => item.isReport === true)
      .map(item => `<li>${item.acc_correctiva}</li>`);
    return `<ul>${accCorrectivaArray.join('')}</ul>`;
  }
*/

function generarListaHTML(valoresArray) {
  const accCorrectivaArray = valoresArray
    .filter(item => item.isReport === true)
    .map(item => `<li style="margin-bottom: 5px;">${item.acc_correctiva}( ${item.jerDesc})</li>`);
  return `<ul>${accCorrectivaArray.join('')}</ul>`;
}

function generarListaCorreo(valoresCorreos) {

  const accCorrectivaCorreos = valoresCorreos
    .map(item => `${item},`);
  return accCorrectivaCorreos;
}

const pathDocument = process.env.PATH_DOCUMENT_CORR;

// función para crear las rutas
const crearRuta = (ruta) => {
  return new Promise((res) => {
    if (!fs.existsSync(ruta)) {
      fs.mkdir(ruta, { recursive: true }, function (error) {
        // se crea la estructura de directorios
        let resp = true;
        if (error) {
          resp = false;
        }
        res(resp);
      });
    } else {
      res(true);
    }
  });
};



const storage_cab = multer.diskStorage({

  destination: function (req, file, cb) {

   
    

    const incidenteFolder = `Incidente_${req.body.ctt_inf}`;
    const informePath = `${pathDocument}/${incidenteFolder}/informe_${req.body.pos_inf}_folio-${req.body.nId}/`;
    const imgPath = `${pathDocument}/${incidenteFolder}/img_${req.body.pos_inf}_folio-${req.body.nId}/`;
    
   let ruta = `${pathDocument}/${incidenteFolder}/`; // se sobreescribe, pero lo dejé igual por si acaso

    if(file.fieldname === 'files_inf'){
      ruta = informePath
    }else if(file.fieldname==='files_img'){
      ruta = imgPath
    }

    crearRuta(ruta).then((resp) => {
      if (resp) {
        cb(null, ruta);
      }
    });

  },

  
  filename: function (req, file, cb) {

    const incidenteFolder = `Incidente_${req.body.ctt_inf}`;

    // se sobreescriben, pero lo dejé igual por si acaso
    let rutaBuscar = `${pathDocument}/Incidente_${req.body.ctt_inf}/${utf8.decode(
      file.originalname
    )}`; 

    if(file.fieldname === 'files_inf'){

      rutaBuscar = `${pathDocument}/${incidenteFolder}/informe_${req.body.pos_inf}/${utf8.decode(
        file.originalname
      )}`;

    }else if(file.fieldname==='files_img'){

      rutaBuscar = `${pathDocument}/${incidenteFolder}/img_${req.body.pos_inf}/${utf8.decode(
        file.originalname
      )}`; 


      }
   

    if (fs.existsSync(rutaBuscar)) {
      // si ya existe este documento en la ruta
      let i = 1;
      do {
      // esto lo hará hasta que la condición del while sea falsa
      if (
        !fs.existsSync(
          file.fieldname === 'files_inf' ? 
          `${pathDocument}/${incidenteFolder}/informe_${req.body.pos_inf}/copia(${i}) ${utf8.decode(
            file.originalname
          )}`
          :
          file.fieldname === 'files_img' ?`${pathDocument}/${incidenteFolder}/img_${req.body.pos_inf}/copia(${i}) ${utf8.decode(
            file.originalname
          )}`
    
          :
          ''

        )
      ){
        // si no existe la copia (ej copia(1)) del documento, la creará
        cb(null, utf8.decode(`copia(${i}) ${file.originalname}`));
      }
      i++;
      }while(
        fs.existsSync(
          file.fieldname === 'files_inf' ? 
          `${pathDocument}/${incidenteFolder}/informe_${req.body.pos_inf}/copia(${i - 1}) ${utf8.decode(
            file.originalname
          )}`
          :
          file.fieldname === 'files_img' ? `${pathDocument}/${incidenteFolder}/img_${req.body.pos_inf}/copia(${i - 1}) ${utf8.decode(
            file.originalname
          )}`
          :
          ''
        )
      ); // esto parará al detectar que esta copia ya existe, si no existe seguirá hasta crear la última
    }else{
      cb(null, utf8.decode(file.originalname));
    }

  },
});
 


const uploadDocumentCab = multer({ storage: storage_cab });

router.post("/guardarIncidente", uploadDocumentCab.fields([{
  name: 'files_inf'
}, {
  name: 'files_img', maxCount: 1
}]) ,(req, res) => {

  const fileImg = req.files.files_img[0].originalname;
const fileInf = req.files.files_inf[0].originalname;


  const fecha = moment().format('YYYY-MM-DD HH:mm')
  const sql= "INSERT INTO inc_registro SET ?";
  const valArray=req.body.valoresArray
  const valCorreo=req.body.correosArray
  const valores=req.body //.data.datos

  const fecOcurrencia =moment(valores.fec_ins).format('YYYY-MM-DD HH:mm')


  let datosArchivos = {
    inc_fec_ocurrencia: fecOcurrencia,
    fk_mina:valores.min_inf,
    fk_nivel: valores.niv_inf,
    inc_lugar: valores.pos_inf,
    fk_actividad:valores.acc_Actividad,
    fk_actividad_2:valores.acc_Actividad_2,
    fk_actividad_3:valores.acc_Actividad_3,
    fk_actividad_4:valores.acc_Actividad_4,
    inc_rut_lider: valores.rut_usu ? valores.rut_usu : null,
    inc_estado:1,
    inc_crea:valores.user,
    inc_fecha_hora_registro:fecha,
    fk_emp:valores.emp_inf,
    fk_ctto:valores.ctt_inf,
    fk_area:valores.are_inf,
    inc_incidente:valores.incidente,
    inc_com_inv:valores.isComisionInvestigadora,
    fk_cal_incidente:valores.cal_inc,
    fk_tip_incidente:valores.tipo_incidente,
    inc_aprendizaje:valores.inc_aprendizaje,
    inc_ruta_archivo:req.files.files_img[0].path,
    inc_fecha_carga:fecha,
    inc_nom_archivo:fileImg,
    inc_consecuencias:valores.inc_consecuencias,
    inc_causas_principales:valores.inc_causas_principales,
    fk_rc:valores.fk_rc,
    inc_otra_actividad:valores.Otras_actividades,

  
  };



  conector.query(sql, datosArchivos, (error,result)=>{
    const arregloDeObjetos = valArray.map(jsonString => JSON.parse(jsonString));
  //  const arregloDeCorreos = valCorreo.map(jsonString => JSON.parse(jsonString));

   
    if(error) throw error;   
    res.status(200).json({result})
    // const accCorrectivaHTML = generarListaHTML(arregloDeObjetos);
    // const accCorreos =generarListaCorreo(valCorreo);
  
    insertarDetalleIncidente(result.insertId, arregloDeObjetos)
    insertarArchIncidente(result.insertId, req.files.files_inf)

    generaFoto(result.insertId);

    setTimeout(() => {
      envioCorreo();
    }, "20000");

     
     // envioFlashSeguridad(result.insertId, valores, accCorrectivaHTML, valores.tipoIncidenteDesc, valores.empreDesc, fileImg, valores.calificaIncidenteDesc, accCorreos )

   /* if (error) throw error;
    console.log(result)
    if(result.affectedRows>0){
      insertarDetalleIncidente(result.insertId, req.body.datos.valoresArray)          
    }
    res.status(200).json(result);
*/

  })

});





const storage_corr = multer.diskStorage({
  destination: function(req, file, cb){
  
   const { cod_iel } = req.body.id; // el id del documento y la categoría

  
   let ruta = `${pathDocument}/cierres/${req.body.id}/`; 
 
   crearRuta(ruta).then((resp) => {
     if (resp) {
       cb(null, ruta);
     }
   });
 
  },
  filename: function (req, file, cb) {
   const {cod_iel} = req
   
   let rutaBuscar =`${pathDocument}/cierres/${req.body.id}/${utf8.decode(
     file.originalname
   )}`; 
   if (fs.existsSync(rutaBuscar)) {
     cb(null, utf8.decode(file.originalname));
   } else {
     cb(null, utf8.decode(file.originalname));
   }
 
 }
 
 })

 const uploadDocumentMant = multer({ storage: storage_corr });

  router.post("/guardarCierre", uploadDocumentMant.array('files'),(req, res) => {



  const fileMan = req.files[0].filename;
  const datoEnMinusculas = fileMan.toLowerCase();
  const datos = req.body;
  const sql= `UPDATE inc_registro_detalle  SET inc_det_estado = 3, inc_obs='${datos.mant_obs}', inc_fec_cierre_real = '${moment().format('YYYY-MM-DD HH:mm')}'
              WHERE id = ${datos.id}  
  
  `;

  const parts = fileMan.split('.');
  const firstPart = parts[0];
  const secondPart = parts[1].trim().toLowerCase();



  
  conector.query(sql, (error,result)=>{
    if(error) throw error;        
    res.status(200).json({result})
    
    
    insertarArchIncidenteDet(datos.id, req.files)
  })

});





/* REPORTERIA */

router.post('/getDataReporte',(req,res)=>{
  
  const { id } = req.body;

  sql = `
  SELECT
  emp.nom_empre AS empresa,
  inc.inc_fec_ocurrencia AS fecha,
  inc.inc_lugar AS lugar,
  min.nom AS mina,
  are.nom AS area,
  niv.nom AS nivel,
  tip.tip_inc_desc AS tipo,
  cal.cal_incidente_desc AS calificacion,
  inc_incidente AS quesucedio,
  inc_ruta_archivo AS evidencia,
  IFNULL(rch.nom, 'Sin riesgo crítico asociado') AS rc,
  IFNULL(med.medidas, 'Sin acciones correctivas') AS medidas,
  inc_causas_principales AS causas,
  inc_consecuencias AS consecuencias,
  inc_aprendizaje AS aprendizaje
  FROM inc_registro inc
  LEFT JOIN tbl_empre emp
  ON emp.rut_empre = inc.fk_emp
  LEFT JOIN rep_mina min
  ON min.id = inc.fk_mina
  LEFT JOIN rep_area are
  ON are.id = inc.fk_area
  LEFT JOIN rep_nivel niv
  ON niv.id = inc.fk_nivel
  LEFT JOIN inc_tipo_incidente tip
  ON tip.id = inc.fk_tip_incidente
  LEFT JOIN inc_calificacion_incidente cal
  ON cal.id = inc.fk_cal_incidente
  LEFT JOIN hal_seg_rc rch
  ON rch.id = inc.fk_rc
  LEFT JOIN (
    SELECT 
    fk_id_incidente, 
    GROUP_CONCAT(inc_med_correctiva SEPARATOR '-|-') AS medidas
    FROM inc_registro_detalle
    WHERE inc_det_reporte = 1
    GROUP BY fk_id_incidente
  ) med
  ON med.fk_id_incidente = inc.id
  WHERE inc.id = ?
  `
  conector.query(sql, [id], (error,result)=>{
  if(error) throw error;        
    res.status(200).json({result})
  })

});



const generaFoto=async(insertId)=>{

  const imageBuffer = await generarImages({
    url : `${process.env.DOMINIO}/web/accionesCorrectivas/reporteCorreo?id=${insertId}`
  })
 
  fs.writeFileSync("./reportes/reporte.png", imageBuffer);

};


module.exports = router;