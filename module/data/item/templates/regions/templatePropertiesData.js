const fields = foundry.data.fields;

export default class TemplateProperties extends foundry.abstract.DataModel {
    static defineSchema() {
        return {
            createTemplate: new fields.BooleanField({ initial: false }),
            templateSize: new fields.NumberField({ initial: 0 }),
            templateType: new fields.StringField({ initial: '' }),
            visualEffectDuration: new fields.NumberField()
        };
    }

}
