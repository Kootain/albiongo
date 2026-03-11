class SpellManager {
    constructor(lang = 'EN-US') {
        this.lang = lang;
        this.spells = {};
        this.isLoaded = false;
    }

    /**
     * Load spell data from a JSON URL or object
     * @param {string|Object} source URL to JSON file or the JSON object itself
     */
    async load(source) {
        try {
            if (typeof source === 'string') {
                const response = await fetch(source);
                this.spells = await response.json();
            } else {
                this.spells = source;
            }
            this.isLoaded = true;
            console.log(`SpellManager loaded ${Object.keys(this.spells).length} spells.`);
        } catch (error) {
            console.error('Failed to load spell data:', error);
            this.isLoaded = false;
        }
    }

    /**
     * Get spell name by index
     * @param {number|string} index Spell index
     * @returns {string} Localized name or UniqueName fallback
     */
    getName(index) {
        const spell = this.getSpell(index);
        if (!spell) return `Unknown Spell (${index})`;

        if (spell.Name && spell.Name[this.lang]) {
            return spell.Name[this.lang];
        }
        
        // Fallback to EN-US if target lang missing
        if (spell.Name && spell.Name['EN-US']) {
            return spell.Name['EN-US'];
        }

        return spell.UniqueName || `Spell ${index}`;
    }

    /**
     * Get spell description by index
     * @param {number|string} index Spell index
     * @returns {string} Localized description or empty string
     */
    getDescription(index) {
        const spell = this.getSpell(index);
        if (!spell) return '';

        if (spell.Description && spell.Description[this.lang]) {
            return this.formatDescription(spell.Description[this.lang]);
        }

        // Fallback to EN-US
        if (spell.Description && spell.Description['EN-US']) {
            return this.formatDescription(spell.Description['EN-US']);
        }

        return '';
    }

    /**
     * Get raw spell object
     * @param {number|string} index 
     */
    getSpell(index) {
        if (!this.isLoaded) {
            console.warn('SpellManager not loaded yet');
            return null;
        }
        return this.spells[String(index)];
    }

    /**
     * Simple formatter to strip or handle Albion's rich text tags like [buff]...[/buff]
     * @param {string} text 
     */
    formatDescription(text) {
        if (!text) return '';
        // Basic stripping of tags like [buff] value [/buff] -> value
        // You might want to enhance this to return HTML or specific formatting
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
    module.exports = SpellManager;
} else {
    window.SpellManager = SpellManager;
}