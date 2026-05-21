const fields = foundry.data.fields;

export default function lifepathData() {
    return {
        shieldParryBonus: new fields.NumberField({ initial: 0 }),
        shieldParryThrownBonus: new fields.NumberField({ initial: 0 }),
        ignoredArmorEncumbrance: new fields.NumberField({ initial: 0 }),
        ignoredEvWhenCasting: new fields.NumberField({ initial: 0 }),
        attacks: new fields.TypedObjectField(
            new fields.SchemaField({
                value: new fields.NumberField({ initial: 0 })
            })
        )
    };
}
