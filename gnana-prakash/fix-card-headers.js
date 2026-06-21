const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx')) results.push(file);
    }
  });
  return results;
}

const files = walk('src/components');

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  let changed = false;

  // Pattern: CardTitle + Search + Add button header
  if (c.includes('<CardTitle className="text-base">') && c.includes('<Search') && c.includes('<Input')) {
    // 1. Outer flex
    c = c.replace(
      '<div className="flex items-center justify-between">\n            <CardTitle className="text-base">Management Module</CardTitle>\n            <div className="flex items-center gap-2">',
      '<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">\n            <CardTitle className="text-base">Management Module</CardTitle>\n            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">'
    );
    
    // Sometimes it's not "Management Module"
    c = c.replace(
      /<div className="flex items-center justify-between">\s*<CardTitle className="text-base">([^<]+)<\/CardTitle>\s*<div className="flex items-center gap-2">/g,
      '<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">\n            <CardTitle className="text-base">$1</CardTitle>\n            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">'
    );

    // 2. Relative wrapper for search
    c = c.replace(
      /<div className="relative">\s*<Search/g,
      '<div className="relative flex-1 sm:flex-none w-full sm:w-auto">\n                <Search'
    );

    // 3. Search input width
    c = c.replace(
      /className="pl-9 h-9 w-48 text-sm"/g,
      'className="pl-9 h-9 w-full sm:w-48 text-sm"'
    );
    c = c.replace(
      /className="pl-9 h-9 w-64 text-sm"/g,
      'className="pl-9 h-9 w-full sm:w-64 text-sm"'
    );

    // 4. Button wrap
    c = c.replace(
      /className="gap-2" onClick=/g,
      'className="gap-2 whitespace-nowrap" onClick='
    );

    changed = true;
  }

  if (changed) {
    fs.writeFileSync(f, c);
    console.log('Fixed card header in ' + f);
  }
});

console.log('Done.');
