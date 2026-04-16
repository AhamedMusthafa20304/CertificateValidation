import express from 'express';

import PDFKitDocument from 'pdfkit';
import { PDFDocument as PDFLibDocument } from 'pdf-lib';
import QRCode from 'qrcode';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(bodyParser.json({ limit: '50mb' }));

  // API Route for Certificate Generation
  app.post('/api/generate-certificate', async (req, res) => {
    try {
      const { studentName, course, issuerName, certificateHash, templateBase64, qrConfig } = req.body;

      if (!studentName || !course || !certificateHash) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // 1. Generate High-Resolution QR Code Buffer
      const qrBuffer = await QRCode.toBuffer(certificateHash, {
        type: 'png',
        width: 500,
        margin: 1,
        errorCorrectionLevel: 'H'
      });

      const mmToPt = 2.83465;
      const qrSize = (qrConfig?.size || 45) * mmToPt;
      const xPos = qrConfig?.x !== undefined ? qrConfig.x * mmToPt : (210 * mmToPt - qrSize - 20 * mmToPt);
      const yPos = qrConfig?.y !== undefined ? qrConfig.y * mmToPt : (297 * mmToPt - qrSize - 20 * mmToPt);

      // Check if template is a PDF
      const isPdfTemplate = templateBase64?.startsWith('data:application/pdf');

      if (isPdfTemplate) {
        // Use pdf-lib to overlay QR on existing PDF
        const templateBytes = Buffer.from(templateBase64.split(',')[1], 'base64');
        const pdfDoc = await PDFLibDocument.load(templateBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        
        const qrImage = await pdfDoc.embedPng(qrBuffer);
        
        // pdf-lib uses bottom-left origin, PDFKit/jsPDF use top-left
        // We need to flip the Y coordinate
        const { height } = firstPage.getSize();
        const flippedY = height - yPos - qrSize;

        firstPage.drawImage(qrImage, {
          x: xPos,
          y: flippedY,
          width: qrSize,
          height: qrSize,
        });

        pdfDoc.setSubject(`CERT_HASH:${certificateHash}`);
        const pdfBytes = await pdfDoc.save();
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=certificate_${studentName.replace(/\s+/g, '_')}.pdf`);
        return res.send(Buffer.from(pdfBytes));
      } else {
        // Use PDFKit for images or blank certificates (Portrait)
        const doc = new PDFKitDocument({
          size: 'A4',
          layout: 'portrait',
          margin: 0,
          compress: false
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=certificate_${studentName.replace(/\s+/g, '_')}.pdf`);
        doc.pipe(res);

        if (templateBase64) {
          try {
            const templateBuffer = Buffer.from(templateBase64.split(',')[1], 'base64');
            doc.image(templateBuffer, 0, 0, {
              width: doc.page.width,
              height: doc.page.height
            });
          } catch (e) {
            console.error("Failed to add template image", e);
          }
        }

        // Add Text Content
        doc.font('Helvetica-Bold').fontSize(30).fillColor('#1e293b').text(studentName, 0, 250, { align: 'center' });
        doc.font('Helvetica').fontSize(18).fillColor('#64748b').text(course, 0, 300, { align: 'center' });
        doc.font('Helvetica-Oblique').fontSize(12).fillColor('#94a3b8').text(`Issued by: ${issuerName || 'Blockchain University'}`, 0, 330, { align: 'center' });
        doc.font('Helvetica').fontSize(1).fillOpacity(0).text(`CERT_HASH:${certificateHash}`, 0, doc.page.height - 2, { lineBreak: false });

        doc.image(qrBuffer, xPos, yPos, {
          width: qrSize,
          height: qrSize
        });

        doc.end();
      }
    } catch (error) {
      console.error('PDF Generation Error:', error);
      res.status(500).json({ error: 'Failed to generate certificate PDF' });
    }
  });

  // Vite middleware for development
 
    app.use(express.static(path.join(__dirname, 'dist')));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

  app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
}

startServer();
