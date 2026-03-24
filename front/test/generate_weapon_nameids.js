const fs = require('fs');

const itemsPath = '/Users/kootain/Code/github.com/Kootain/albiongo/data/items.json';
const weaponTypesPath = '/Users/kootain/Code/github.com/Kootain/albiongo/data/weapon_types.json';
const outputPath = '/Users/kootain/Code/github.com/Kootain/albiongo/front/test/weapons_subset.json';

const items = require(itemsPath);
const weaponTypes = require(weaponTypesPath);

const nameToItem = {};

for (const key in items) {
    const item = items[key];
    if (item.Name && item.Name['ZH-CN'] && item.NameID) {
        if (!nameToItem[item.Name['ZH-CN']]) {
            nameToItem[item.Name['ZH-CN']] = {
                Index: item.NameID,
                UniqueName: item.NameID,
                Name: item.Name
            };
        }
    }
}

const weaponsSubset = {};

for (const weapon of weaponTypes) {
    const item = nameToItem[weapon.name];
    if (item) {
        weaponsSubset[item.Index] = item;
    } else {
        console.warn(`Warning: Could not find NameID for ${weapon.name}`);
    }
}

fs.writeFileSync(outputPath, JSON.stringify(weaponsSubset, null, 2));
console.log(`Generated ${Object.keys(weaponsSubset).length} weapons with NameID to ${outputPath}`);
