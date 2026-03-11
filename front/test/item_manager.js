class ItemManager {
    constructor(lang = 'ZH-CN') {
        this.lang = lang;
        this.items = {}; // Maps Index (string) to Item Object
        this.isLoaded = false;
    }

    /**
     * Load item data from a JSON URL or object
     * @param {string|Object} source URL to JSON file or the JSON object itself
     */
    async load(source) {
        try {
            let data;
            if (typeof source === 'string') {
                const response = await fetch(source);
                data = await response.json();
            } else {
                data = source;
            }

            // Convert array to map for O(1) access by Index
            // Assuming the JSON structure is an array of objects
            if (Array.isArray(data)) {
                this.items = {};
                for (const item of data) {
                    if (item && item.Index) {
                        this.items[String(item.Index)] = item;
                    }
                }
            } else if (typeof data === 'object') {
                // If already a map (unlikely based on dump, but possible)
                this.items = data;
            }

            this.isLoaded = true;
            console.log(`ItemManager loaded ${Object.keys(this.items).length} items.`);
        } catch (error) {
            console.error('Failed to load item data:', error);
            this.isLoaded = false;
        }
    }

    /**
     * Get item name by index
     * @param {number|string} index Item index
     * @returns {string} Localized name or UniqueName fallback
     */
    getName(index) {
        const item = this.getItem(index);
        if (!item) return `Unknown Item (${index})`;

        if (item.Name && item.Name[this.lang]) {
            return item.Name[this.lang];
        }
        
        // Fallback to EN-US if target lang missing
        if (item.Name && item.Name['EN-US']) {
            return item.Name['EN-US'];
        }

        return item.UniqueName || `Item ${index}`;
    }

    /**
     * Get item description by index
     * @param {number|string} index Item index
     * @returns {string} Localized description or empty string
     */
    getDescription(index) {
        const item = this.getItem(index);
        if (!item) return '';

        if (item.Description && item.Description[this.lang]) {
            return this.formatDescription(item.Description[this.lang]);
        }

        // Fallback to EN-US
        if (item.Description && item.Description['EN-US']) {
            return this.formatDescription(item.Description['EN-US']);
        }

        return '';
    }

    /**
     * Get item details including Tier and Enchant
     * @param {number|string} index Item index
     * @returns {Object} { tier: number, enchant: number, uniqueName: string }
     */
    getItemInfo(index) {
        const item = this.getItem(index);
        if (!item) return { tier: 0, enchant: 0, uniqueName: '' };

        return {
            tier: item.Tier || 0,
            enchant: item.Enchant || 0,
            uniqueName: item.UniqueName || ''
        };
    }

    /**
     * Get raw item object
     * @param {number|string} index 
     */
    getItem(index) {
        if (!this.isLoaded) {
            console.warn('ItemManager not loaded yet');
            return null;
        }
        return this.items[String(index)];
    }

    /**
     * Simple formatter to strip or handle Albion's rich text tags like [buff]...[/buff]
     * @param {string} text 
     */
    formatDescription(text) {
        if (!text) return '';
        return text.replace(/\[\/?\w+\]/g, ''); 
    }

    /**
     * Set current language
     * @param {string} lang e.g. 'ZH-CN', 'EN-US'
     */
    setLanguage(lang) {
        this.lang = lang;
    }
}

// Export for module usage, or attach to window for browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ItemManager;
} else {
    window.ItemManager = ItemManager;
}