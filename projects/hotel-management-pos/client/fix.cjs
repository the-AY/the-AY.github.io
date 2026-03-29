const fs = require('fs');
['Login.jsx', 'AdminDashboard.jsx', 'CashierPOS.jsx', 'KitchenKDS.jsx'].forEach(file => {
  const p = 'src/pages/' + file;
  let code = fs.readFileSync(p, 'utf8');
  // Replace escaped backticks with actual backticks
  code = code.replace(/\\`/g, '`');
  // Replace escaped dollars with actual dollars
  code = code.replace(/\\\$/g, '$');
  fs.writeFileSync(p, code);
  console.log('Fixed', p);
});
