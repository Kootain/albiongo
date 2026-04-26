# Add enrichItems Feature Spec

## Why
Currently, the test client enriches spell IDs with spell names using `spellManager`. We need similar functionality for items to make the logs more readable by displaying item names alongside their IDs, specifically for fields like `ItemID`, `ItemIDs`, `EquipmentIDs`, and `EquipmentID`.

## What Changes
- Include `item_manager.js` script in `test_client.html`.
- Initialize `ItemManager` instance and load data from `http://localhost:8081/data/items.json`.
- Implement `enrichItems` recursive function to process the parsed JSON payload and append item names.
- Call `enrichItems` inside the `appendLog` function before rendering the log entry.

## Impact
- Affected specs: None.
- Affected code: `e:\Code\albiongo\front\test\test_client.html`

## ADDED Requirements
### Requirement: Item Name Enrichment
The system SHALL display item names for item IDs in the WebSocket event logs.

#### Scenario: Success case
- **WHEN** a WebSocket message contains `ItemID`, `ItemIDs`, `EquipmentIDs`, or `EquipmentID`.
- **THEN** the parsed object is enriched with `ItemName`, `ItemNames`, `EquipmentNames`, or `EquipmentName` respectively using the `ItemManager`.
