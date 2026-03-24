const fs = require('fs');

const inputPath = '/Users/kootain/Code/github.com/Kootain/albiongo/front/test/temp_weapon_classifier.json';
const weaponsSubsetPath = '/Users/kootain/Code/github.com/Kootain/albiongo/front/test/weapons_subset.json';

// Read files
const classifierData = require(inputPath);
const weaponsSubset = require(weaponsSubsetPath);

// Create a mapping from Chinese name to NameID
const nameToId = {};
for (const [nameId, item] of Object.entries(weaponsSubset)) {
    if (item.Name && item.Name['ZH-CN']) {
        nameToId[item.Name['ZH-CN']] = nameId;
    }
}

// Convert classifier data
const newClassifierData = {};
let unknownNames = [];

for (const [category, names] of Object.entries(classifierData)) {
    newClassifierData[category] = [];
    for (const name of names) {
        if (nameToId[name]) {
            newClassifierData[category].push(nameToId[name]);
        } else {
            unknownNames.push(name);
            console.warn(`Warning: Could not find NameID for ${name}`);
        }
    }
}

// Write the result back
fs.writeFileSync(inputPath, JSON.stringify(newClassifierData, null, 2));

console.log('Conversion complete!');
if (unknownNames.length > 0) {
    console.log(`Could not convert ${unknownNames.length} items:`, unknownNames);
}
