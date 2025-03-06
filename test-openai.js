const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: 'test'
});

// Print available methods on the OpenAI client
console.log('OpenAI client methods:');
console.log(Object.keys(openai));

// Check assistants methods
console.log('\nAssistants methods:');
console.log(Object.getOwnPropertyNames(openai.beta.assistants).filter(n => !n.startsWith('_')));

// Check if 'files' is a property on assistants
console.log('\nIs "files" a property on beta.assistants?', 'files' in openai.beta.assistants);

// Check methods in openai.files
console.log('\nFiles methods:');
console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(openai.files))
  .filter(n => n !== 'constructor' && !n.startsWith('_')));

// Check if the attachToAssistant method exists
console.log('\nDoes openai.files have attachToAssistant?', 
  Object.getOwnPropertyNames(Object.getPrototypeOf(openai.files))
    .includes('attachToAssistant'));

// Try to check all methods deeply
console.log('\nAll methods related to assistants and files:');

// Helper function to explore and print all available methods
function exploreMethods(obj, path = '') {
  if (!obj || typeof obj !== 'object') return;
  
  for (const key in obj) {
    try {
      if (key === 'constructor' || key.startsWith('_')) continue;
      
      const fullPath = path ? `${path}.${key}` : key;
      
      // Skip if we've gone too deep
      if (fullPath.split('.').length > 4) continue;
      
      console.log(fullPath);
      
      const value = obj[key];
      if (value && typeof value === 'object' && Object.keys(value).length < 20) {
        exploreMethods(value, fullPath);
      }
    } catch (err) {
      // Ignore
    }
  }
}

exploreMethods(openai.beta.assistants);
exploreMethods(openai.files);