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
    
  const rut = req.body.res.data.rut
  const sql = `SELECT * FROM epp_usuarios WHERE rut = ? `

  conector.query(sql,[rut],(err, result)=>{

    if(err) throw err   

    let user = '';

    // Si existe en la tabla tiene un permiso y puede hacer otras cosas, de lo contrario es un usuario de la appsgom que sólo puede pedir epp
    if(result.length>0){
      
      user={
        rutUsu:result[0].rut,            
        perUsu:result[0].fk_perfil,
      }
      
      res.status(200).json({user});

    }else{

      user={
        rutUsu:rut,
        perUsu:0,
      }
    
      res.status(200).json({user});

    }
        
  })

 })

module.exports = router;