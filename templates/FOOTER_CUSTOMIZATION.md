# PDF Footer Customization

## Current Implementation

The PDF footer is now handled by the PDF generation library (`html-pdf-node`) using the `footerTemplate` option in `exportController.js`.

## Location

File: `digital_backend/src/controllers/exportController.js`

Look for the `footerTemplate` property in the PDF options.

## How to Customize

### 1. Modify Footer Content

Edit the `footerTemplate` in `exportController.js`:

```javascript
footerTemplate: `
  <div style="width: 100%; padding: 10px 20px; background-color: #333; color: white; font-size: 9px; text-align: center;">
    <!-- Your custom footer content here -->
  </div>
`,
```

### 2. Add Page Numbers

To add page numbers, use these special classes:
- `.pageNumber` - Current page number
- `.totalPages` - Total number of pages

Example:
```javascript
footerTemplate: `
  <div style="width: 100%; padding: 10px 20px; background-color: #333; color: white; font-size: 9px;">
    <div style="display: flex; justify-content: space-between;">
      <span>Digital World Contact Info</span>
      <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
    </div>
  </div>
`,
```

### 3. Adjust Footer Height

If you change the footer height, also update the bottom margin:

```javascript
margin: {
  top: "80px",
  bottom: "120px", // <-- Adjust this to match your footer height
  left: "20px",
  right: "20px"
}
```

## Important Notes

- Footer appears on **every page** automatically
- Use inline styles only (external CSS won't work in footerTemplate)
- Footer height should match the bottom margin
- Content in HTML template automatically flows around the reserved footer space

## Benefits of This Approach

✅ Footer appears consistently on all pages  
✅ No content overlap issues  
✅ Automatic page breaking  
✅ Can add page numbers easily  
✅ Professional multi-page PDFs

