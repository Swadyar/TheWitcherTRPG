import Skill from './skillData.js';

const fields = foundry.data.fields;

export default class Intelligence extends foundry.abstract.DataModel {
    static defineSchema() {
        return {
            awareness: new fields.EmbeddedDataField(Skill, { label: 'WITCHER.skills.awareness.label' }),
            business: new fields.EmbeddedDataField(Skill, { label: 'WITCHER.skills.business.label' }),
            deduction: new fields.EmbeddedDataField(Skill, { label: 'WITCHER.skills.deduction.label' }),
            education: new fields.EmbeddedDataField(Skill, { label: 'WITCHER.skills.education.label' }),
            commonsp: new fields.EmbeddedDataField(Skill, { label: 'WITCHER.skills.commonSpeech.label' }),
            eldersp: new fields.EmbeddedDataField(Skill, { label: 'WITCHER.skills.elderSpeech.label' }),
            dwarven: new fields.EmbeddedDataField(Skill, { label: 'WITCHER.skills.dwarvenSpeech.label' }),
            monster: new fields.EmbeddedDataField(Skill, { label: 'WITCHER.skills.monsterLore.label' }),
            socialetq: new fields.EmbeddedDataField(Skill, { label: 'WITCHER.skills.socialEtiquette.label' }),
            streetwise: new fields.EmbeddedDataField(Skill, { label: 'WITCHER.skills.streetwise.label' }),
            tactics: new fields.EmbeddedDataField(Skill, { label: 'WITCHER.skills.tactics.label' }),
            teaching: new fields.EmbeddedDataField(Skill, { label: 'WITCHER.skills.teaching.label' }),
            wilderness: new fields.EmbeddedDataField(Skill, { label: 'WITCHER.skills.wildernessSurvival.label' })
        };
    }

    /** @inheritdoc */
    static migrateData(source) {
        Object.keys(this.defineSchema()).forEach(skillName => {
            if (source[skillName]) {
                source[skillName].label = `WITCHER.skills.${skillName}.label`;
            }
        });

        if (source.commonsp) source.commonsp.label = 'WITCHER.skills.commonSpeech.label';
        if (source.eldersp) source.eldersp.label = 'WITCHER.skills.elderSpeech.label';
        if (source.dwarven) source.dwarven.label = 'WITCHER.skills.dwarvenSpeech.label';
        if (source.monster) source.monster.label = 'WITCHER.skills.monsterLore.label';
        if (source.socialetq) source.socialetq.label = 'WITCHER.skills.socialEtiquette.label';
        if (source.wilderness) source.wilderness.label = 'WITCHER.skills.wildernessSurvival.label';

        return super.migrateData(source);
    }
}
