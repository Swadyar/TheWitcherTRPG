import CommonActorData from './commonActorData.js';

const fields = foundry.data.fields;

export default class MonsterData extends CommonActorData {
    static defineSchema() {
        const commonData = super.defineSchema();
        return {
            // Using destructuring to effectively append our additional data here
            ...commonData,
            category: new fields.StringField({ initial: 'Humanoid' }),
            threat: new fields.StringField({ initial: '' }),
            difficulty: new fields.StringField({ initial: '' }),
            bounty: new fields.NumberField({ initial: 0 }),
            resistantNonSilver: new fields.BooleanField({
                initial: false,
                label: 'WITCHER.Monster.resistantNonSilver'
            }),
            resistantNonMeteorite: new fields.BooleanField({
                initial: false,
                label: 'WITCHER.Monster.resistantNonMeteorite'
            }),

            armorHead: new fields.NumberField({ initial: 0 }),
            armorUpper: new fields.NumberField({ initial: 0 }),
            armorLower: new fields.NumberField({ initial: 0 }),
            armorTailWing: new fields.NumberField({ initial: 0 }),
            regeneration: new fields.NumberField({ initial: 0, label: 'WITCHER.Monster.regeneration' }),

            resistances: new fields.StringField({ initial: '' }),
            immunities: new fields.StringField({ initial: '' }),
            statusEffectImmunities: new fields.ArrayField(new fields.StringField({ initial: '' })),
            susceptibilities: new fields.StringField({ initial: '' }),
            senses: new fields.StringField({ initial: '' }),

            height: new fields.StringField({ initial: '' }),
            weight: new fields.StringField({ initial: '' }),
            environment: new fields.StringField({ initial: '' }),
            intelligence: new fields.StringField({ initial: '' }),
            organization: new fields.StringField({ initial: '' }),

            common: new fields.StringField({ initial: '' }),
            commonSkillValue: new fields.StringField({ initial: '' }),
            showCommonerSuperstition: new fields.BooleanField({
                initial: true,
                label: 'WITCHER.Monster.CommonerSuperstition'
            }),
            academicKnowledge: new fields.StringField({ initial: '' }),
            academicKnowledgeSkillValue: new fields.StringField({ initial: '' }),
            showAcademicKnowledge: new fields.BooleanField({
                initial: true,
                label: 'WITCHER.Monster.AcademicKnowledge'
            }),
            monsterLore: new fields.StringField({ initial: '' }),
            monsterLoreSkillValue: new fields.StringField({ initial: '' }),
            showMonsterLore: new fields.BooleanField({ initial: true, label: 'WITCHER.Monster.WitcherKnowledge' }),

            customStat: new fields.BooleanField({ initial: false, label: 'WITCHER.Monster.CustomHP/STA' }),
            addMeleeBonus: new fields.BooleanField({ initial: false, label: 'WITCHER.Monster.addMeleeBonus' }),
            dontAddAttr: new fields.BooleanField({ initial: false, label: 'WITCHER.Monster.dontAddAttr' }),
            hasTailWing: new fields.BooleanField({ initial: false, label: 'WITCHER.Monster.hasTailWing' })
        };
    }
}
