const fs = require('fs');
const path = require('path');

// Create temp directory if it doesn't exist
if (!fs.existsSync(path.join(__dirname, '_temp'))) {
  fs.mkdirSync(path.join(__dirname, '_temp'), { recursive: true });
}

// Source files to move
const sourceFiles = [
  'src/app/api/employees/[id]/route.ts',
  'src/app/api/employees/leader/[leaderId]/route.ts',
  'src/app/api/employees/company/[companyId]/route.ts',
];

sourceFiles.forEach((sourcePath, index) => {
  const fullSourcePath = path.join(__dirname, sourcePath);
  const destPath = path.join(__dirname, `_temp/route${index + 3}.ts`);

  // Check if source file exists
  if (fs.existsSync(fullSourcePath)) {
    // Copy file content
    const content = fs.readFileSync(fullSourcePath, 'utf8');
    
    // Write to destination
    fs.writeFileSync(destPath, content);
    
    // Delete original file
    fs.unlinkSync(fullSourcePath);
    
    console.log(`File ${sourcePath} moved successfully`);
  } else {
    console.error(`Source file ${sourcePath} not found`);
  }
});