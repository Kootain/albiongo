# Tasks
- [x] Task 1: Include and Initialize ItemManager
  - [x] SubTask 1.1: Add `<script src="item_manager.js"></script>` to `test_client.html`.
  - [x] SubTask 1.2: Initialize `const itemManager = new ItemManager('ZH-CN');` and load data from `http://localhost:8081/data/items.json`.
- [x] Task 2: Implement and apply `enrichItems`
  - [x] SubTask 2.1: Implement the `enrichItems` recursive function to handle `ItemID`, `ItemIDs`, `EquipmentIDs`, and `EquipmentID`.
  - [x] SubTask 2.2: Call `enrichItems(parsed)` inside `appendLog` function, right next to `enrichSpells`.
