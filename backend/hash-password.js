const bcrypt = require('bcrypt');

// Get password from command line argument or use default
const password = process.argv[2] || 'admin123';

bcrypt.hash(password, 10).then(hash => {
  console.log('\n========================================');
  console.log('Password Hash Generated:');
  console.log('========================================');
  console.log(hash);
  console.log('\nUse this hash in your SQL INSERT statement');
  console.log('========================================\n');
}).catch(err => {
  console.error('Error hashing password:', err);
});
