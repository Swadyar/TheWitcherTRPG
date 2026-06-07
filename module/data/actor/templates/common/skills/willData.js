import Skill from './skillData.js';

const fields = foundry.data.fields;

export default class Will extends foundry.abstract.DataModel {
    static defineSchema() {
        return {
            courage: new fields.EmbeddedDataField(Skill, { label: 'WITCHER.skills.courage.label' }),
            hexweave: new fields.EmbeddedDataField(Skill, { label: 'WITCHER.skills.hexWeaving.label' }),
            intimidation: new fields.EmbeddedDataField(Skill, { label: 'WITCHER.skills.intimidation.label' }),
            spellcast: new fields.EmbeddedDataField(Skill, { label: 'WITCHER.skills.spellCasting.label' }),
            resistmagic: new fields.EmbeddedDataField(Skill, { label: 'WITCHER.skills.resistMagic.label' }),
            resistcoerc: new fields.EmbeddedDataField(Skill, { label: 'WITCHER.skills.resistCoercion.label' }),
            ritcraft: new fields.EmbeddedDataField(Skill, { label: 'WITCHER.skills.ritualCrafting.label' })
        };
    }

    /** @inheritdoc */
    static migrateData(source) {
        Object.keys(this.defineSchema()).forEach(skillName => {
            if (source[skillName]) {
                source[skillName].label = `WITCHER.skills.${skillName}.label`;
            }
        });

        if (source.hexweave) source.hexweave.label = 'WITCHER.skills.hexWeaving.label';
        if (source.spellcast) source.spellcast.label = 'WITCHER.skills.spellCasting.label';
        if (source.resistmagic) source.resistmagic.label = 'WITCHER.skills.resistMagic.label';
        if (source.resistcoerc) source.resistcoerc.label = 'WITCHER.skills.resistCoercion.label';
        if (source.ritcraft) source.ritcraft.label = 'WITCHER.skills.ritualCrafting.label';

        return super.migrateData(source);
    }
}
