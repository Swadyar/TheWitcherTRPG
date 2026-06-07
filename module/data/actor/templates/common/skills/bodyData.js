import Skill from './skillData.js';

const fields = foundry.data.fields;

export default class Body extends foundry.abstract.DataModel {
    static defineSchema() {
        return {
            physique: new fields.EmbeddedDataField(Skill, { label: 'WITCHER.skills.physique.label' }),
            endurance: new fields.EmbeddedDataField(Skill, { label: 'WITCHER.skills.endurance.label' })
        };
    }

    /** @inheritdoc */
    static migrateData(source) {
        Object.keys(this.defineSchema()).forEach(skillName => {
            if (source[skillName]) {
                source[skillName].label = `WITCHER.skills.${skillName}.label`;
            }
        });

        return super.migrateData(source);
    }
}
