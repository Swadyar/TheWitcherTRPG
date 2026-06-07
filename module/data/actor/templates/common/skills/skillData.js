const fields = foundry.data.fields;

export default class Skill extends foundry.abstract.DataModel {
    static defineSchema(label) {
        return {
            value: new fields.NumberField({ initial: 0 }),
            label: new fields.StringField({ initial: label }),
            isVisible: new fields.BooleanField({ initial: false, label: label }),
            activeEffectModifiers: new fields.NumberField({ initial: 0 }),
            isProfession: new fields.BooleanField({ initial: false }),
            isPickup: new fields.BooleanField({ initial: false }),
            isLearned: new fields.BooleanField({ initial: false })
        };
    }

    get modifiedValue() {
        return this.value + this.activeEffectModifiers;
    }
}
