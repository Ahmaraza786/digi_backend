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
      customerName: challan.customer_name,
      purchaseOrderNo: challan.purchaseOrder.purchase_order_no,
      materialsTable: generateMaterialsTable(challan.materials)
    };
    
    // Replace placeholders in template
    Object.keys(templateData).forEach(key => {
      const placeholder = `{{${key}}}`;
      htmlTemplate = htmlTemplate.replace(new RegExp(placeholder, 'g'), templateData[key]);
    });
    
    // Generate PDF using html-pdf-node
    const options = {
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.2in',
        right: '0.2in',
        bottom: '0.2in',
        left: '0.2in'
      },
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    };
    
    const pdfBuffer = await htmlPdf.generatePdf({ content: htmlTemplate }, options);
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="challan-${challan.challan_no}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
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
      customerName: challan.customer_name,
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
