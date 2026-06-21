const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('page.tsx')) results.push(file);
    }
  });
  return results;
}
const files = walk('src/app/(dashboard)');
files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  let changed = false;
  if (c.includes('className="p-6 space-y-6"')) {
    c = c.replace(/className="p-6 space-y-6"/g, 'className="p-4 md:p-6 space-y-4 md:space-y-6"');
    changed = true;
  }
  if (c.includes('className="p-6"')) {
    c = c.replace(/className="p-6"/g, 'className="p-4 md:p-6"');
    changed = true;
  }
  if (c.includes('className="p-6 ')) {
    c = c.replace(/className="p-6 /g, 'className="p-4 md:p-6 ');
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(f, c);
    console.log('Fixed padding in ' + f);
  }
});
console.log('Done.');
