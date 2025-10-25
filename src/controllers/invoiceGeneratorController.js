const { Invoice, Customer, PurchaseOrder, Quotation, Material, Tax } = require('../models');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const pdf = require('html-pdf-node');

// Register Handlebars helpers
handlebars.registerHelper('add', function(a, b) {
  return a + b;
});

// Generate invoice PDF
const generateInvoicePDF = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    // Fetch invoice with all related data
    const invoice = await Invoice.findByPk(invoiceId, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customer_name', 'company_name', 'address', 'company_address', 'telephone_number']
        },
        {
          model: PurchaseOrder,
          as: 'purchaseOrder',
          attributes: ['id', 'purchase_order_no', 'customer', 'status'],
          include: [
            {
              model: Quotation,
              as: 'quotation',
              attributes: ['id', 'title', 'total_price', 'status', 'materials']
            }
          ]
        },
        {
          model: Quotation,
          as: 'quotation',
          attributes: ['id', 'title', 'total_price', 'status', 'materials']
        }
      ]
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Read the template file
    const templatePath = path.join(__dirname, '../../templates/invoice.html');
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    
    // Compile the template
    const template = handlebars.compile(templateSource);

    // Get invoice creation date
    const currentDate = new Date(invoice.created_at).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    // Get materials from quotation (either direct or through purchase order)
    let materials = [];
    if (invoice.quotation?.materials) {
      // Parse materials if they're stored as JSON string
      materials = typeof invoice.quotation.materials === 'string' 
        ? JSON.parse(invoice.quotation.materials) 
        : invoice.quotation.materials;
    } else if (invoice.purchaseOrder?.quotation?.materials) {
      // Parse materials if they're stored as JSON string
      materials = typeof invoice.purchaseOrder.quotation.materials === 'string' 
        ? JSON.parse(invoice.purchaseOrder.quotation.materials) 
        : invoice.purchaseOrder.quotation.materials;
    }
    
    // Process materials to include material names and calculate totals
    if (materials && materials.length > 0) {
      const processedMaterials = [];
      for (const material of materials) {
        // Fetch material details
        const materialDetails = await Material.findByPk(material.material_id);
        if (materialDetails) {
          // Filter materials based on invoice type
          if (invoice.invoice_type && materialDetails.material_type !== invoice.invoice_type) {
            continue; // Skip materials that don't match the invoice type
          }
          
          const totalPrice = parseFloat(material.quantity) * parseFloat(material.unit_price);
          processedMaterials.push({
            material_name: materialDetails.name,
            quantity: material.quantity,
            unit: material.unit,
            unit_price: material.unit_price,
            total_price: totalPrice,
            material_type: materialDetails.material_type
          });
        }
      }
      materials = processedMaterials;
    }
    
    console.log('Materials found (filtered by invoice type):', materials);
    console.log('Invoice type:', invoice.invoice_type);

    // Check if tax should be withheld
    let taxPercentage = 0; // Default to 0% if with_hold_tax is false
    if (invoice.with_hold_tax) {
      // Fetch tax percentage based on invoice type only if with_hold_tax is true
      try {
        const taxRecord = await Tax.findOne({
          where: { service_type: invoice.invoice_type }
        });
        if (taxRecord) {
          taxPercentage = parseFloat(taxRecord.tax_percent);
          console.log(`Tax percentage for ${invoice.invoice_type}: ${taxPercentage}%`);
        } else {
          taxPercentage = 18; // Default fallback
          console.log(`No tax record found for ${invoice.invoice_type}, using default 18%`);
        }
      } catch (error) {
        console.error('Error fetching tax percentage:', error);
        taxPercentage = 18; // Default fallback
        console.log('Using default tax percentage: 18%');
      }
    } else {
      console.log('Withhold tax is false, setting tax percentage to 0%');
    }

    // Calculate totals from materials if available, otherwise use invoice total
    let subTotal = parseFloat(invoice.total_amount);
    let gstAmount = 0;
    let grandTotal = parseFloat(invoice.total_amount);

    if (materials && materials.length > 0) {
      // Calculate subtotal from materials
      subTotal = materials.reduce((sum, material) => {
        return sum + (parseFloat(material.total_price) || 0);
      }, 0);
      
      // Calculate GST using dynamic tax percentage
      gstAmount = subTotal * (taxPercentage / 100);
      grandTotal = subTotal + gstAmount;
    } else {
      // For invoices without materials, calculate GST from total amount
      gstAmount = parseFloat(invoice.total_amount) * (taxPercentage / 100);
      grandTotal = parseFloat(invoice.total_amount) + gstAmount;
    }

    // Prepare template data
    const templateData = {
      currentDate: currentDate,
      purchaseOrderNumber: invoice.purchaseOrder?.purchase_order_no || 'N/A',
      invoiceId: invoice.id,
      invoiceDescription: invoice.description || 'Invoice Description',
      companyName: invoice.customer?.company_name || invoice.customer?.customer_name || 'N/A',
      companyAddress: invoice.customer?.company_address || invoice.customer?.address || 'N/A',
      companyCity: 'Lahore-54760', // Default city, can be made dynamic
      companyNTN: '0700057-0', // Default NTN, can be made dynamic
      companySTRN: '0306321000191', // Default STRN, can be made dynamic
      materials: materials,
      totalAmount: parseFloat(invoice.total_amount).toLocaleString(),
      subTotal: subTotal.toLocaleString(),
      gstAmount: gstAmount.toLocaleString(),
      grandTotal: grandTotal.toLocaleString(),
      taxPercentage: taxPercentage
    };
    
    console.log('Template data:', JSON.stringify(templateData, null, 2));

    // Generate HTML content
    const htmlContent = template(templateData);

    // Generate PDF using html-pdf-node
    console.log('Generating PDF with html-pdf-node...');
    
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
      height: '11.69in'
    };
    
    const pdfBuffer = await pdf.generatePdf({ content: htmlContent }, options);
    console.log('PDF generated successfully with html-pdf-node, size:', pdfBuffer.length);

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.id}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Pragma', 'no-cache');
    
    console.log('Sending PDF response with headers:', {
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length,
      'Content-Disposition': `attachment; filename="invoice-${invoice.id}.pdf"`
    });
    
    // Send the PDF
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Generate invoice HTML for preview
const generateInvoiceHTML = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    // Fetch invoice with all related data
    const invoice = await Invoice.findByPk(invoiceId, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customer_name', 'company_name', 'address', 'company_address', 'telephone_number']
        },
        {
          model: PurchaseOrder,
          as: 'purchaseOrder',
          attributes: ['id', 'purchase_order_no', 'customer', 'status', 'description'],
          include: [
            {
              model: Quotation,
              as: 'quotation',
              attributes: ['id', 'title', 'total_price', 'status', 'materials']
            }
          ]
        },
        {
          model: Quotation,
          as: 'quotation',
          attributes: ['id', 'title', 'total_price', 'status', 'materials']
        }
      ]
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Read the template file
    const templatePath = path.join(__dirname, '../../templates/invoice.html');
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    
    // Compile the template
    const template = handlebars.compile(templateSource);

    // Get invoice creation date
    const currentDate = new Date(invoice.created_at).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    // Get materials from quotation (either direct or through purchase order)
    let materials = [];
    if (invoice.quotation?.materials) {
      // Parse materials if they're stored as JSON string
      materials = typeof invoice.quotation.materials === 'string' 
        ? JSON.parse(invoice.quotation.materials) 
        : invoice.quotation.materials;
    } else if (invoice.purchaseOrder?.quotation?.materials) {
      // Parse materials if they're stored as JSON string
      materials = typeof invoice.purchaseOrder.quotation.materials === 'string' 
        ? JSON.parse(invoice.purchaseOrder.quotation.materials) 
        : invoice.purchaseOrder.quotation.materials;
    }
    
    // Process materials to include material names and calculate totals
    if (materials && materials.length > 0) {
      const processedMaterials = [];
      for (const material of materials) {
        // Fetch material details
        const materialDetails = await Material.findByPk(material.material_id);
        if (materialDetails) {
          // Filter materials based on invoice type
          if (invoice.invoice_type && materialDetails.material_type !== invoice.invoice_type) {
            continue; // Skip materials that don't match the invoice type
          }
          
          const totalPrice = parseFloat(material.quantity) * parseFloat(material.unit_price);
          processedMaterials.push({
            material_name: materialDetails.name,
            quantity: material.quantity,
            unit: material.unit,
            unit_price: material.unit_price,
            total_price: totalPrice,
            material_type: materialDetails.material_type
          });
        }
      }
      materials = processedMaterials;
    }
    
    console.log('Materials found (filtered by invoice type):', materials);
    console.log('Invoice type:', invoice.invoice_type);

    // Check if tax should be withheld
    let taxPercentage = 0; // Default to 0% if with_hold_tax is false
    if (invoice.with_hold_tax) {
      // Fetch tax percentage based on invoice type only if with_hold_tax is true
      try {
        const taxRecord = await Tax.findOne({
          where: { service_type: invoice.invoice_type }
        });
        if (taxRecord) {
          taxPercentage = parseFloat(taxRecord.tax_percent);
          console.log(`Tax percentage for ${invoice.invoice_type}: ${taxPercentage}%`);
        } else {
          taxPercentage = 18; // Default fallback
          console.log(`No tax record found for ${invoice.invoice_type}, using default 18%`);
        }
      } catch (error) {
        console.error('Error fetching tax percentage:', error);
        taxPercentage = 18; // Default fallback
        console.log('Using default tax percentage: 18%');
      }
    } else {
      console.log('Withhold tax is false, setting tax percentage to 0%');
    }

    // Calculate totals from materials if available, otherwise use invoice total
    let subTotal = parseFloat(invoice.total_amount);
    let gstAmount = 0;
    let grandTotal = parseFloat(invoice.total_amount);

    if (materials && materials.length > 0) {
      // Calculate subtotal from materials
      subTotal = materials.reduce((sum, material) => {
        return sum + (parseFloat(material.total_price) || 0);
      }, 0);
      
      // Calculate GST using dynamic tax percentage
      gstAmount = subTotal * (taxPercentage / 100);
      grandTotal = subTotal + gstAmount;
    } else {
      // For invoices without materials, calculate GST from total amount
      gstAmount = parseFloat(invoice.total_amount) * (taxPercentage / 100);
      grandTotal = parseFloat(invoice.total_amount) + gstAmount;
    }

    // Prepare template data
    const templateData = {
      currentDate: currentDate,
      purchaseOrderNumber: invoice.purchaseOrder?.purchase_order_no || 'N/A',
      invoiceId: invoice.id,
      invoiceDescription: invoice.description || 'Invoice Description',
      companyName: invoice.customer?.company_name || invoice.customer?.customer_name || 'N/A',
      companyAddress: invoice.customer?.company_address || invoice.customer?.address || 'N/A',
      companyCity: 'Lahore-54760', // Default city, can be made dynamic
      companyNTN: '0700057-0', // Default NTN, can be made dynamic
      companySTRN: '0306321000191', // Default STRN, can be made dynamic
      materials: materials,
      totalAmount: parseFloat(invoice.total_amount).toLocaleString(),
      subTotal: subTotal.toLocaleString(),
      gstAmount: gstAmount.toLocaleString(),
      grandTotal: grandTotal.toLocaleString(),
      taxPercentage: taxPercentage
    };
    
    console.log('Template data:', JSON.stringify(templateData, null, 2));

    // Generate HTML content
    const htmlContent = template(templateData);

    // Return the HTML content
    res.json({
      success: true,
      html: htmlContent
    });

  } catch (error) {
    console.error('Error generating invoice HTML:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  generateInvoicePDF,
  generateInvoiceHTML
};
