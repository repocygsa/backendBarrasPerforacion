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
const generarImagesStatus = require('../../puppeteer/generarImgStatus');


const buscarCorreos=()=>{
  return new Promise(res=>{
    let sql=`
    SELECT correo 
    FROM inc_correos
    WHERE tipo = 1
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
        path: `${process.env.PATH_DOCUMENT_APE}/reporteStatus/reporteStatus.png`,
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
  
    newMailer.enviarCorreo(correoVerificacion, listaCorreos,'Status general acciones correctivas GOM ', plantilla, attachments)
  
  };

const generaFotoStatusAdm=async(req, res)=>{


    try {
      const imageBuffer = await generarImagesStatus({
        url: `${process.env.DOMINIO}/web/accionesCorrectivas/CorreoDetalleAcciones`
      });
  
      fs.writeFileSync("./reporteStatus/reporteStatus.png", imageBuffer);
  
     // res.status(200).json({ message: 'Reporte generado exitosamente.' });
     
     /*
      setTimeout(() => {
        envioCorreo();
      }, "20000"); */
  
    } catch (error) {
      console.error('Error al generar el reporte:', error);
    //  res.status(500).json({ error: 'Error interno del servidor.' });
    }
  
  };

  module.exports = {generaFotoStatusAdm};