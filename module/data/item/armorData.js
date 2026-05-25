import CommonItemData from './commonItemData.js';
import itemEffect from './templates/itemEffectData.js';
import { associatedDiagramUuid, unwrapAssociatedDiagram } from './templates/associatedDiagramData.js';
import SpData from './templates/armor/spData.js';
import ResistanceData from './templates/armor/resistanceData.js';

import DefenseProperties from './templates/combat/defensePropertiesData.js';

const fields = foundry.data.fields;

export default class ArmorData extends CommonItemData {
    static defineSchema() {
        const commonData = super.defineSchema();
        return {
            // Using destructuring to effectively append our additional data here
            ...commonData,
            type: new fields.StringField({
                initial: 'Light',
                choices: ['Light', 'Medium', 'Heavy', 'Natural']
            }),
            location: new fields.ArrayField(
                new fields.StringField({
                    initial: 'Torso',
                    choices: ['Head', 'Torso', 'Leg', 'FullCover']
                })
            ),

            avail: new fields.StringField({ initial: '' }),
            equipped: new fields.BooleanField({ initial: false }),

            reliability: new fields.NumberField({ initial: 0 }),
            reliabilityMax: new fields.NumberField({ initial: 0 }),
            encumb: new fields.NumberField({ initial: 0 }),
            location: new fields.StringField({ initial: '' }),

            resistance: new fields.EmbeddedDataField(ResistanceData),

            head: new fields.EmbeddedDataField(SpData),
            torso: new fields.EmbeddedDataField(SpData),
            leftArm: new fields.EmbeddedDataField(SpData),
            rightArm: new fields.EmbeddedDataField(SpData),
            leftLeg: new fields.EmbeddedDataField(SpData),
            rightLeg: new fields.EmbeddedDataField(SpData),

            enhancements: new fields.NumberField({ initial: 0 }),
            enhancementItemIds: new fields.ArrayField(new fields.StringField({ initial: '' })),

            effects: new fields.TypedObjectField(new fields.SchemaField(itemEffect())),

            ...associatedDiagramUuid(),
            defenseProperties: new fields.EmbeddedDataField(DefenseProperties)
        };
    }

    get effectsWithEnhancements() {
        let effects = { ...this.effects };

        this.enhancementItems
            ?.filter(item => Object.keys(item).length !== 0)
            .forEach(enhancement => (effects = { ...effects, ...enhancement.system.effects }));

        return effects;
    }

    get enhancementsEffects() {
        let effects = {};

        this.enhancementItems
            ?.filter(item => Object.keys(item).length !== 0)
            .forEach(enhancement => (effects = { ...effects, ...enhancement.system?.effects }));

        return effects;
    }

    async applySpDamage(location, spDamage) {
        if (this[location.name].modifiedStoppingPower - spDamage >= 0) {
            this.parent.update({
                [`system.${location.name}.stoppingPower`]: this[location.name].stoppingPower - spDamage
            });
        }
    }

    get canBeRepaired() {
        return (
            this.associatedDiagramUuid &&
            (this.reliability < this.reliabilityMax ||
                this.head.stoppingPower < this.head.maxStoppingPower ||
                this.torso.stoppingPower < this.torso.maxStoppingPower ||
                this.leftArm.stoppingPower < this.leftArm.maxStoppingPower ||
                this.rightArm.stoppingPower < this.rightArm.maxStoppingPower ||
                this.leftLeg.stoppingPower < this.leftLeg.maxStoppingPower ||
                this.rightLeg.stoppingPower < this.rightLeg.maxStoppingPower)
        );
    }

    async repair() {
        this.parent.update({
            'system.reliability': this.reliabilityMax,
            'system.head.stoppingPower': this.head.maxStoppingPower,
            'system.torso.stoppingPower': this.torso.maxStoppingPower,
            'system.leftArm.stoppingPower': this.leftArm.maxStoppingPower,
            'system.rightArm.stoppingPower': this.rightArm.maxStoppingPower,
            'system.leftLeg.stoppingPower': this.leftLeg.maxStoppingPower,
            'system.rightLeg.stoppingPower': this.rightLeg.maxStoppingPower
        });
    }

    prepareBaseData() {
        super.prepareBaseData();
        this.resistance.prepareBaseData();
        this.head.prepareBaseData();
        this.torso.prepareBaseData();
        this.leftArm.prepareBaseData();
        this.rightArm.prepareBaseData();
        this.leftLeg.prepareBaseData();
        this.rightLeg.prepareBaseData();
    }

    prepareDerivedData() {
        super.prepareDerivedData();

        let enhancementItemIds = this.enhancementItemIds;
        if (enhancementItemIds?.length > 0) {
            this.enhancementItems = [];

            let items = this.parent.actor.items;

            enhancementItemIds
                .filter(id => id)
                .forEach(itemId => {
                    let item = items.get(itemId);
                    if (item) {
                        this.enhancementItems.push({
                            name: item.name,
                            img: item.img,
                            system: item.system,
                            id: itemId
                        });
                    }
                });
        }

        this.freeEnhancements = new Array(this.enhancements - (this.enhancementItemIds?.length ?? 0)).fill({});

        this.resistance.prepareDerivedData();

        this.head.prepareDerivedData();
        this.torso.prepareDerivedData();
        this.leftArm.prepareDerivedData();
        this.rightArm.prepareDerivedData();
        this.leftLeg.prepareDerivedData();
        this.rightLeg.prepareDerivedData();

        unwrapAssociatedDiagram(this);
    }

    /** @inheritdoc */
    static migrateData(source) {
        if ('enhancementItems' in source) {
            source.enhancementItemIds = source.enhancementItemIds ?? [];
            source.enhancementItems.forEach(enhancement => {
                if (Object.keys(enhancement).length !== 0) {
                    source.enhancementItemIds.push(enhancement._id);
                }
            });
        }

        this.effects?.forEach(effect => (effect.percentage = parseInt(effect.percentage)));
        this.migrateEffectsToTypedField(source);
        this.migrateSpFields(source);
        this.migrateResitances(source);
        source;

        return super.migrateData(source);
    }

    static migrateEffectsToTypedField(source) {
        if (Array.isArray(source.effects) && source.effects.length > 0) {
            source.effects = Object.fromEntries(
                source.effects.map(o => {
                    return [foundry.utils.randomID(), o];
                })
            );
            delete source.effects;
        }
    }

    static migrateSpFields(source) {
        if (source.headMaxStopping) {
            if (!source.head) {
                source.head = {};
            }
            source.head.stoppingPower = source.headStopping;
            source.head.maxStoppingPower = source.headMaxStopping;
            delete source.headStopping;
            delete source.headMaxStopping;
        }

        if (source.torsoMaxStopping) {
            if (!source.torso) {
                source.torso = {};
            }
            source.torso.stoppingPower = source.torsoStopping;
            source.torso.maxStoppingPower = source.torsoMaxStopping;
            delete source.torsoStopping;
            delete source.torsoMaxStopping;
        }

        if (source.leftArmMaxStopping) {
            if (!source.leftArm) {
                source.leftArm = {};
            }
            source.leftArm.stoppingPower = source.leftArmStopping;
            source.leftArm.maxStoppingPower = source.leftArmMaxStopping;
            delete source.leftArmStopping;
            delete source.leftArmMaxStopping;
        }

        if (source.rightArmMaxStopping) {
            if (!source.rightArm) {
                source.rightArm = {};
            }
            source.rightArm.stoppingPower = source.rightArmStopping;
            source.rightArm.maxStoppingPower = source.rightArmMaxStopping;
            delete source.rightArmStopping;
            delete source.rightArmMaxStopping;
        }

        if (source.leftLegMaxStopping) {
            if (!source.leftLeg) {
                source.leftLeg = {};
            }
            source.leftLeg.stoppingPower = source.leftLegStopping;
            source.leftLeg.maxStoppingPower = source.leftLegMaxStopping;
            delete source.leftLegStopping;
            delete source.leftLegMaxStopping;
        }

        if (source.rightLegMaxStopping) {
            if (!source.rightLeg) {
                source.rightLeg = {};
            }
            source.rightLeg.stoppingPower = source.rightLegStopping;
            source.rightLeg.maxStoppingPower = source.rightLegMaxStopping;
            delete source.rightLegStopping;
            delete source.rightLegMaxStopping;
        }
    }

    static migrateResitances(source) {
        if (!source.resistance) {
            source.resistance = {};
        }
        if (source.bludgeoning) {
            source.resistance.bludgeoning = source.bludgeoning;
            delete source.bludgeoning;
        }
        if (source.slashing) {
            source.resistance.slashing = source.slashing;
            delete source.slashing;
        }
        if (source.piercing) {
            source.resistance.piercing = source.piercing;
            delete source.piercing;
        }
    }
}
