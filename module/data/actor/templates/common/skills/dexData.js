import Skill from './skillData.js';

const fields = foundry.data.fields;

export default class Dexterity extends foundry.abstract.DataModel {
    static defineSchema() {
        return {
            archery: new fields.EmbeddedDataField(Skill, { label: 'WITCHER.skills.archery.label' }),
            athletics: new fields.EmbeddedDataField(Skill, { label: 'WITCHER.skills.athletics.label' }),
            crossbow: new fields.EmbeddedDataField(Skill, { label: 'WITCHER.skills.crossbow.label' }),
            sleight: new fields.EmbeddedDataField(Skill, { label: 'WITCHER.skills.sleightOfHand.label' }),
            stealth: new fields.EmbeddedDataField(Skill, { label: 'WITCHER.skills.stealth.label' })
        };
    }

    /** @inheritdoc */
    static migrateData(source) {
        Object.keys(this.defineSchema()).forEach(skillName => {
            if (source[skillName]) {
                source[skillName].label = `WITCHER.skills.${skillName}.label`;
            }
        });

        if (source.sleight) {
            source.sleight.label = 'WITCHER.skills.sleightOfHand.label';
        }

        return super.migrateData(source);
    }
}
