const db = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const pdf = require('html-pdf-node');

// Register Handlebars helpers
handlebars.registerHelper('add', function(a, b) {
  return a + b;
});

// Test function
const testExport = (req, res) => {
  res.json({ message: 'Export test successful' });
};

// Export paid invoices to CSV
const exportPaidInvoicesCSV = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include the entire end date

    // Fetch paid invoices within date range
    const invoices = await db.Invoice.findAll({
      where: {
        status: 'paid',
        created_at: {
          [Op.between]: [start, end]
        }
      },
      include: [
        {
          model: db.Customer,
          as: 'customer',
          attributes: ['id', 'customer_name', 'company_name', 'ntn']
        },
        {
          model: db.PurchaseOrder,
          as: 'purchaseOrder',
          attributes: ['id', 'purchase_order_no']
        }
      ],
      order: [['created_at', 'ASC']]
    });

    // Generate CSV content
    const csvHeaders = [
      'Invoice Date',
      'Invoice No',
      'Customer Name',
      'NTN No.',
      'PO No.',
      'Work Detail',
      'Work Amount',
      'GST %age',
      'GST Amount',
      'Amount with GST',
      'Amount Received',
      'W.H Tax Deduction',
      'S.T Deduction',
      'Month/Year',
      'Balance',
      'Aging',
      'Cheque Amount',
      'Cost/Chgs/Voch.No',
      'Bank',
      'Deposit Date',
      'DW Bank'
    ];

    const csvRows = invoices.map(invoice => {
      const invoiceDate = new Date(invoice.created_at);
      const currentDate = new Date();
      
      // Calculate aging in days
      const aging = Math.floor((currentDate - invoiceDate) / (1000 * 60 * 60 * 24));
      
      // Calculate GST
      const workAmount = parseFloat(invoice.total_amount);
      const gstPercentage = invoice.invoice_type === 'material' ? 18 : 0;
      const gstAmount = (workAmount * gstPercentage) / 100;
      const amountWithGST = workAmount + gstAmount;
      
      // Calculate W.H Tax Deduction
      const whTaxPercentage = invoice.invoice_type === 'service' ? 16 : 0;
      const whTaxAmount = (workAmount * whTaxPercentage) / 100;
      
      // Format dates
      const formattedInvoiceDate = invoiceDate.toLocaleDateString('en-GB');
      const monthYear = `${invoiceDate.getMonth() + 1}/${invoiceDate.getFullYear()}`;
      const formattedDepositDate = invoice.deposit_date ? new Date(invoice.deposit_date).toLocaleDateString('en-GB') : '';

      return [
        formattedInvoiceDate,
        invoice.id.toString(),
        invoice.customer?.customer_name || '',
        invoice.customer?.ntn || '',
        invoice.purchaseOrder?.purchase_order_no || '',
        invoice.description || '',
        workAmount.toFixed(2),
        `${gstPercentage}%`,
        gstAmount.toFixed(2),
        amountWithGST.toFixed(2),
        workAmount.toFixed(2),
        `${whTaxPercentage}%`,
        '0%', // S.T Deduction - not specified in requirements
        monthYear,
        '0', // Balance - always 0 as per requirements
        aging.toString(),
        invoice.cheque_amount ? parseFloat(invoice.cheque_amount).toFixed(2) : '',
        invoice.voucher_no || '',
        invoice.bank || '',
        formattedDepositDate,
        invoice.dw_bank || ''
      ];
    });

    // Create CSV content
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    // Set response headers for CSV download
    const filename = `paid_invoices_${startDate}_to_${endDate}.csv`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.send(csvContent);

  } catch (error) {
    console.error('Error exporting paid invoices CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export paid invoices',
      error: error.message
    });
  }
};

// Generate quotation PDF
const generateQuotationPDF = async (req, res) => {
  try {
    const { quotationId } = req.params;

    // Fetch quotation with all related data
    const quotation = await db.Quotation.findByPk(quotationId, {
      include: [
        {
          model: db.Customer,
          as: 'customer',
          attributes: ['id', 'customer_name', 'company_name', 'address', 'company_address', 'telephone_number', 'fax']
        }
      ]
    });

    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    // Read the template file
    const templatePath = path.join(__dirname, '../../templates/index.html');
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    
    // Compile the template
    const template = handlebars.compile(templateSource);

    // Get quotation creation date
    const currentDate = new Date(quotation.created_at).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    // Parse materials if they're stored as JSON string
    let materials = [];
    if (quotation.materials) {
      materials = typeof quotation.materials === 'string' 
        ? JSON.parse(quotation.materials) 
        : quotation.materials;
    }

    // Fetch material descriptions from Material model
    const materialIds = materials.map(m => m.material_id).filter(id => id);
    const materialDetails = await db.Material.findAll({
      where: { id: { [Op.in]: materialIds } },
      attributes: ['id', 'name', 'description']
    });
    
    // Create a map for quick lookup
    const materialMap = {};
    materialDetails.forEach(material => {
      materialMap[material.id] = {
        name: material.name,
        description: material.description
      };
    });

    // Fetch tax rates that were effective on the quotation creation date
    const quotationDate = new Date(quotation.created_at);
    const taxes = await db.Tax.findAll({
      where: {
        effective_from: {
          [Op.lte]: quotationDate
        },
        [Op.or]: [
          { effective_to: null },
          { effective_to: { [Op.gte]: quotationDate } }
        ]
      },
      order: [['service_type', 'ASC'], ['effective_from', 'DESC']]
    });
    
    const taxRates = {};
    taxes.forEach(tax => {
      // Use the most recent tax rate for each service type
      if (!taxRates[tax.service_type]) {
        taxRates[tax.service_type] = parseFloat(tax.tax_percent);
      }
    });

    // Calculate tax for each material and totals
    let subTotal = 0;
    let totalGST = 0;
    
    materials.forEach(material => {
      const materialTotal = (material.quantity || 0) * (material.unit_price || 0);
      subTotal += materialTotal;
      
      // Calculate tax based on material type
      const materialType = material.material_type || 'material';
      const taxRate = taxRates[materialType] || 0;
      const materialTax = (materialTotal * taxRate) / 100;
      totalGST += materialTax;
      
      // Add tax amount to material object
      material.tax_amount = materialTax;
      material.tax_rate = taxRate;
    });

    const grandTotal = subTotal + totalGST;

    // Prepare template data to match the template placeholders
    const templateData = {
      'CustomerCompanyName': quotation.customer?.company_name || quotation.customer?.customer_name || 'N/A',
      'CustomerAddress': quotation.customer?.company_address || quotation.customer?.address || 'N/A',
      'CustomerTelephone': quotation.customer?.telephone_number || 'N/A',
      'CustomerFax': quotation.customer?.fax || 'N/A',
      'Date': currentDate,
      'CustomerName': quotation.customer?.customer_name || quotation.customer?.company_name || 'N/A',
      'quote_title': quotation.title || 'Quotation',
      'MATERIAL_ROWS': materials.map((material, index) => {
        const unitPrice = Number(material.unit_price) || 0;
        const taxAmount = Number(material.tax_amount) || 0;
        const rowTotal = (Number(material.quantity) || 0) * unitPrice;
        
        // Get material details
        const materialInfo = materialMap[material.material_id];
        const materialName = material.material_name || materialInfo?.name || 'Unknown Material';
        const materialDescription = materialInfo?.description;
        
        // Format description column with material name (bold) and description below
        let descriptionCell = `<strong>${materialName}</strong>`;
        if (materialDescription) {
          descriptionCell += `<br><span style="font-size: 0.9em; color: #666;">${materialDescription}</span>`;
        }
        
        return `
        <tr>
          <td class="bord">${index + 1}</td>
          <td class="bord" style="text-align: left;">${descriptionCell}</td>
          <td class="bord">${material.quantity || 0}</td>
          <td class="bord">${material.unit || 'EA'}</td>
          <td class="bord">${unitPrice.toLocaleString()}</td>
          <td class="bord">${taxAmount.toLocaleString()}</td>
          <td class="bord">${rowTotal.toLocaleString()}</td>
        </tr>
      `;
      }).join(''),
      'Ex-Total': subTotal.toLocaleString(),
      'GST_Total': totalGST.toLocaleString(),
      'G-Total': grandTotal.toLocaleString()
    };
    
    console.log('Quotation template data:', JSON.stringify(templateData, null, 2));

    // Generate HTML content
    const htmlContent = template(templateData);

    // Generate PDF using html-pdf-node
    console.log('Generating quotation PDF with html-pdf-node...');
    
    const options = {
      format: 'A4',
      margin: {
        top: '0.1in',
        right: '0.1in',
        bottom: '0.1in',
        left: '0.1in'
      },
      printBackground: true,
      displayHeaderFooter: false,
      preferCSSPageSize: true,
      width: '8.27in',
      height: '11.69in',
      executablePath: '/usr/bin/google-chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    };
    
    const pdfBuffer = await pdf.generatePdf({ content: htmlContent }, options);
    console.log('Quotation PDF generated successfully with html-pdf-node, size:', pdfBuffer.length);

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="quotation-${quotation.id}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating quotation PDF:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Generate quotation HTML for preview
const generateQuotationHTML = async (req, res) => {
  try {
    const { quotationId } = req.params;

    // Fetch quotation with all related data
    const quotation = await db.Quotation.findByPk(quotationId, {
      include: [
        {
          model: db.Customer,
          as: 'customer',
          attributes: ['id', 'customer_name', 'company_name', 'address', 'company_address', 'telephone_number', 'fax']
        }
      ]
    });

    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    // Read the template file
    const templatePath = path.join(__dirname, '../../templates/index.html');
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    
    // Compile the template
    const template = handlebars.compile(templateSource);

    // Get quotation creation date
    const currentDate = new Date(quotation.created_at).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    // Parse materials if they're stored as JSON string
    let materials = [];
    if (quotation.materials) {
      materials = typeof quotation.materials === 'string' 
        ? JSON.parse(quotation.materials) 
        : quotation.materials;
    }

    // Fetch material descriptions from Material model
    const materialIds = materials.map(m => m.material_id).filter(id => id);
    const materialDetails = await db.Material.findAll({
      where: { id: { [Op.in]: materialIds } },
      attributes: ['id', 'name', 'description']
    });
    
    // Create a map for quick lookup
    const materialMap = {};
    materialDetails.forEach(material => {
      materialMap[material.id] = {
        name: material.name,
        description: material.description
      };
    });

    // Fetch tax rates that were effective on the quotation creation date
    const quotationDate = new Date(quotation.created_at);
    const taxes = await db.Tax.findAll({
      where: {
        effective_from: {
          [Op.lte]: quotationDate
        },
        [Op.or]: [
          { effective_to: null },
          { effective_to: { [Op.gte]: quotationDate } }
        ]
      },
      order: [['service_type', 'ASC'], ['effective_from', 'DESC']]
    });
    
    const taxRates = {};
    taxes.forEach(tax => {
      // Use the most recent tax rate for each service type
      if (!taxRates[tax.service_type]) {
        taxRates[tax.service_type] = parseFloat(tax.tax_percent);
      }
    });

    // Calculate tax for each material and totals
    let subTotal = 0;
    let totalGST = 0;
    
    materials.forEach(material => {
      const materialTotal = (material.quantity || 0) * (material.unit_price || 0);
      subTotal += materialTotal;
      
      // Calculate tax based on material type
      const materialType = material.material_type || 'material';
      const taxRate = taxRates[materialType] || 0;
      const materialTax = (materialTotal * taxRate) / 100;
      totalGST += materialTax;
      
      // Add tax amount to material object
      material.tax_amount = materialTax;
      material.tax_rate = taxRate;
    });

    const grandTotal = subTotal + totalGST;

    // Prepare template data to match the template placeholders
    const templateData = {
      'CustomerCompanyName': quotation.customer?.company_name || quotation.customer?.customer_name || 'N/A',
      'CustomerAddress': quotation.customer?.company_address || quotation.customer?.address || 'N/A',
      'CustomerTelephone': quotation.customer?.telephone_number || 'N/A',
      'CustomerFax': quotation.customer?.fax || 'N/A',
      'Date': currentDate,
      'CustomerName': quotation.customer?.customer_name || quotation.customer?.company_name || 'N/A',
      'quote_title': quotation.title || 'Quotation',
      'MATERIAL_ROWS': materials.map((material, index) => {
        const unitPrice = Number(material.unit_price) || 0;
        const taxAmount = Number(material.tax_amount) || 0;
        const rowTotal = (Number(material.quantity) || 0) * unitPrice;
        
        // Get material details
        const materialInfo = materialMap[material.material_id];
        const materialName = material.material_name || materialInfo?.name || 'Unknown Material';
        const materialDescription = materialInfo?.description;
        
        // Format description column with material name (bold) and description below
        let descriptionCell = `<strong>${materialName}</strong>`;
        if (materialDescription) {
          descriptionCell += `<br><span style="font-size: 0.9em; color: #666;">${materialDescription}</span>`;
        }
        
        return `
        <tr>
          <td class="bord">${index + 1}</td>
          <td class="bord" style="text-align: left;">${descriptionCell}</td>
          <td class="bord">${material.quantity || 0}</td>
          <td class="bord">${material.unit || 'EA'}</td>
          <td class="bord">${unitPrice.toLocaleString()}</td>
          <td class="bord">${taxAmount.toLocaleString()}</td>
          <td class="bord">${rowTotal.toLocaleString()}</td>
        </tr>
      `;
      }).join(''),
      'Ex-Total': subTotal.toLocaleString(),
      'GST_Total': totalGST.toLocaleString(),
      'G-Total': grandTotal.toLocaleString()
    };
    
    console.log('Quotation template data:', JSON.stringify(templateData, null, 2));

    // Generate HTML content
    const htmlContent = template(templateData);

    // Return the HTML content
    res.json({
      success: true,
      html: htmlContent
    });

  } catch (error) {
    console.error('Error generating quotation HTML:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  testExport,
  exportPaidInvoicesCSV,
  generateQuotationPDF,
  generateQuotationHTML
};