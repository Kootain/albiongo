const fs = require('fs');
const path = require('path');
const ItemManager = require('./item_manager');

const dataDir = path.join(__dirname, '../../data');
const weaponTypeFile = path.join(dataDir, 'weapone_type');
const itemsFile = path.join(dataDir, 'items.json');
const outputFile = path.join(dataDir, 'weapon_types.json');

async function main() {
    // 1. Read and parse weapone_type
    console.log(`Reading weapon types from ${weaponTypeFile}...`);
    if (!fs.existsSync(weaponTypeFile)) {
        console.error("Weapon type file does not exist!");
        return;
    }
    const content = fs.readFileSync(weaponTypeFile, 'utf-8');
    console.log(`File content length: ${content.length}`);
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    console.log(`Found ${lines.length} lines.`);
    
    const weaponTypes = [];
    for (const line of lines) {
        // Use a more robust regex for splitting: tab or multiple spaces
        const parts = line.trim().split(/[\t\s]+/); 
        if (parts.length >= 2) {
            weaponTypes.push({
                name: parts[0].trim(),
                type: parts[1].trim()
            });
        } else {
            console.log(`Skipping line: "${line}" (parts: ${parts.length})`);
        }
    }

    // 2. Write to JSON
    console.log(`Writing ${weaponTypes.length} weapon types to ${outputFile}...`);
    fs.writeFileSync(outputFile, JSON.stringify(weaponTypes, null, 2), 'utf-8');

    // 3. Load items
    console.log('Loading items...');
    if (!fs.existsSync(itemsFile)) {
        console.error(`Items file not found at ${itemsFile}`);
        return;
    }
    
    // Read large JSON file
    const itemsRaw = fs.readFileSync(itemsFile, 'utf-8');
    const itemsData = JSON.parse(itemsRaw);

    const itemManager = new ItemManager('ZH-CN');
    await itemManager.load(itemsData);

    // 4. Verify names
    console.log('Verifying weapon names...');
    
    // Build a set of all known ZH-CN names
    const knownNames = new Set();
    const itemMap = itemManager.items; // Direct access since we are in node
    
    for (const key in itemMap) {
        const item = itemMap[key];
        if (item.Name && item.Name['ZH-CN']) {
            knownNames.add(item.Name['ZH-CN']);
        }
    }

    const missing = [];
    const found = [];

    for (const weapon of weaponTypes) {
        if (knownNames.has(weapon.name)) {
            found.push(weapon.name);
        } else {
            missing.push(weapon.name);
        }
    }

    console.log('------------------------------------------------');
    console.log(`Total Weapons Checked: ${weaponTypes.length}`);
    console.log(`Found: ${found.length}`);
    console.log(`Missing: ${missing.length}`);
    
    if (missing.length > 0) {
        console.log('------------------------------------------------');
        console.log('Missing Weapons (Not found in items.json ZH-CN names):');
        missing.forEach(name => console.log(`- ${name}`));
    } else {
        console.log('All weapon names verified successfully!');
    }
    console.log('------------------------------------------------');
}

main().catch(console.error);
