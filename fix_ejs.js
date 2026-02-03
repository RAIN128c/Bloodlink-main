const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'views', 'history-detail.ejs');

console.log('Reading file...');
let content = fs.readFileSync(filePath, 'utf8');

// Check for escaped unicode
const escapedCount = (content.match(/\\u003c/g) || []).length;
console.log(`Found ${escapedCount} instances of "\\u003c" (escaped <)`);

// Replace escaped unicode back to actual character
content = content.replace(/\\u003c/g, '<');

// Also replace any "<% -" with "<%-"  
content = content.replace(/<% -/g, '<%-');

// Write back
fs.writeFileSync(filePath, content, 'utf8');
console.log('File fixed and saved!');

// Show line 111
const lines = content.split('\n');
if (lines[110]) {
    console.log('Line 111 (first 120 chars):', lines[110].substring(0, 120));
}
