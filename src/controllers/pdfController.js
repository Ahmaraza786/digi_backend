const htmlPdf = require('html-pdf-node');
const fs = require('fs');
const path = require('path');
const { Challan, PurchaseOrder, Quotation, Customer } = require('../models');

// Generate PDF from HTML template
const generateChallanPDF = async (req, res) => {
  try {
    const { challanId } = req.params;
    
    // Get challan with related data
    const challan = await Challan.findByPk(challanId, {
      include: [
        {
          model: PurchaseOrder,
          as: 'purchaseOrder',
          attributes: ['id', 'purchase_order_no', 'customer']
        },
        {
          model: Quotation,
          as: 'quotation',
          attributes: ['id', 'title', 'materials']
        },
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customer_name', 'company_name', 'telephone_number', 'address']
        }
      ]
    });
    
    if (!challan) {
      return res.status(404).json({
        success: false,
        message: 'Challan not found'
      });
    }
    
    // Read the HTML template
    const templatePath = path.join(__dirname, '../../templates/generatechallan.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');
    
    // Prepare data for template replacement
    const templateData = {
      challanDate: challan.challan_date,
      challanNo: challan.challan_no,
      customerName: challan.customer?.company_name || challan.customer?.customer_name || challan.customer_name || 'N/A',
      purchaseOrderNo: challan.purchaseOrder.purchase_order_no,
      materialsTable: generateMaterialsTable(challan.materials)
    };
    
    // Replace placeholders in template
    Object.keys(templateData).forEach(key => {
      const placeholder = `{{${key}}}`;
      htmlTemplate = htmlTemplate.replace(new RegExp(placeholder, 'g'), templateData[key]);
    });
    
    // Generate PDF using html-pdf-node with footer
    const options = {
      format: 'A4',
      margin: {
        top: "10px",     // Minimal top margin
        bottom: "120px", // Space for footer
        left: "20px",
        right: "20px"
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div style="font-size: 10px;"></div>', // Empty header with required style
      footerTemplate: `
        <div style="font-size: 10px; width: 100%;height: 40px; margin: 0; padding: 0;">
          <div style="width: 100%; padding: 12px 20px; background-color: #333 !important; color: white; text-align: center; line-height: 1.4; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; margin: 0;">
            <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; align-items: center; font-size: 9px;">
              <span style="white-space: nowrap;">📍 512 A-1 Block, Gurumangat Road Near Nisar Art Press Gulberg-III Lahore</span>
              <span style="white-space: nowrap;">📞 Ph: +92-42-35887770</span>
               <span style="white-space: nowrap;">📱 +92-300-4336230</span>
              <span style="color: #333; white-space: nowrap;">Life</span>
              <span style="white-space: nowrap;">✉️ sales@digitalworld.pk</span>
              <span style="white-space: nowrap;">🌐 www.digitalworld.pk</span>
              <span style="white-space: nowrap;">📘 digitalworldlahore</span>
            </div>
          </div>
        </div>
      `,
      preferCSSPageSize: false,
      executablePath: '/usr/bin/google-chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--force-color-profile=srgb']
    };
    
    const pdfBuffer = await htmlPdf.generatePdf({ content: htmlTemplate }, options);
    console.log('Challan PDF generated successfully with footer, size:', pdfBuffer.length);
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="challan-${challan.challan_no}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Send PDF buffer
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: error.message
    });
  }
};

// Generate materials table HTML
const generateMaterialsTable = (materials) => {
  if (!materials || !Array.isArray(materials)) {
    return '<tr><td colspan="4" style="text-align: center; padding: 20px;">No materials found</td></tr>';
  }
  
  return materials.map((material, index) => `
    <tr>
      <td>${String(index + 1).padStart(2, '0')}</td>
      <td class="description">${material.material_name || 'N/A'}</td>
      <td>${material.quantity || 0}</td>
      <td>${material.unit || 'N/A'}</td>
    </tr>
  `).join('');
};

// Generate challan preview (HTML)
const generateChallanPreview = async (req, res) => {
  try {
    const { challanId } = req.params;
    
    // Get challan with related data
    const challan = await Challan.findByPk(challanId, {
      include: [
        {
          model: PurchaseOrder,
          as: 'purchaseOrder',
          attributes: ['id', 'purchase_order_no', 'customer']
        },
        {
          model: Quotation,
          as: 'quotation',
          attributes: ['id', 'title', 'materials']
        },
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customer_name', 'company_name', 'telephone_number', 'address']
        }
      ]
    });
    
    if (!challan) {
      return res.status(404).json({
        success: false,
        message: 'Challan not found'
      });
    }
    
    // Read the HTML template
    const templatePath = path.join(__dirname, '../../templates/generatechallan.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');
    
    // Prepare data for template replacement
    const templateData = {
      challanDate: challan.challan_date,
      challanNo: challan.challan_no,
      customerName: challan.customer?.company_name || challan.customer?.customer_name || challan.customer_name || 'N/A',
      purchaseOrderNo: challan.purchaseOrder.purchase_order_no,
      materialsTable: generateMaterialsTable(challan.materials)
    };
    
    // Replace placeholders in template
    Object.keys(templateData).forEach(key => {
      const placeholder = `{{${key}}}`;
      htmlTemplate = htmlTemplate.replace(new RegExp(placeholder, 'g'), templateData[key]);
    });
    
    // Return HTML for preview
    res.setHeader('Content-Type', 'text/html');
    res.send(htmlTemplate);
    
  } catch (error) {
    console.error('Error generating preview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate preview',
      error: error.message
    });
  }
};

module.exports = {
  generateChallanPDF,
  generateChallanPreview
};
