const fs = require('fs');
const path = require('path');

// Create temp directory if it doesn't exist
if (!fs.existsSync(path.join(__dirname, '_temp'))) {
  fs.mkdirSync(path.join(__dirname, '_temp'), { recursive: true });
}

// Source file path
const sourcePath = path.join(__dirname, 'src/app/api/departments/company/[companyId]/route.ts');

// Destination file path
const destPath = path.join(__dirname, '_temp/route2.ts');

// Check if source file exists
if (fs.existsSync(sourcePath)) {
  // Copy file content
  const content = fs.readFileSync(sourcePath, 'utf8');
  
  // Write to destination
  fs.writeFileSync(destPath, content);
  
  // Delete original file
  fs.unlinkSync(sourcePath);
  
  console.log('File moved successfully');
} else {
  console.error('Source file not found');
}