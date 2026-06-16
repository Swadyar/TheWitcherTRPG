import AbilityTemplate from '../../../item/ability-template.js';

export let spellVisualMixin = {
    async createSpellVisuals(roll, damage, options) {
        if (
            this.templateProperties.createTemplate &&
            this.templateProperties.templateType &&
            this.templateProperties.templateSize
        ) {
            AbilityTemplate.fromItem(this.parent)
                ?.drawPreview()
                .then(templates => {
                    if (this.regionProperties.createRegionFromTemplate) {
                        this.regionProperties.createRegionFromTemplates(templates, roll, damage, options);
                    }

                    return templates;
                })
                .then(templates => this.deleteSpellVisualEffect(templates))
                .catch(() => {});
        }
    },

    async deleteSpellVisualEffect(region) {
        if (region && this.templateProperties.visualEffectDuration > 0) {
            setTimeout(() => {
                canvas.scene.deleteEmbeddedDocuments('Region', [region.id]);
            }, this.templateProperties.visualEffectDuration * 1000);
        }
    }
};
