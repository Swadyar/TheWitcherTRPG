import { getRandomInt } from '../../scripts/helper.js';
import { applyActiveEffectToActorViaId } from '../../scripts/temporaryEffects/applyActiveEffect.js';
import { applyStatusEffectToActor } from '../../scripts/statusEffects/applyStatusEffect.js';
import { DamageInstance } from '../../scripts/damageInstance.js';

export let damageMixin = {
    async applyDamage(dialogData, damageInstances, damageObject, derivedStat) {
        damageInstances = await this.handleShield(damageInstances);

        if (!damageObject.properties.bypassesShield) {
            if (!damageInstances.some(instance => instance.damage > 0)) {
                return;
            }
        }

        if (this.system.category && damageObject.properties?.oilEffect === this.system.category) {
            damageInstances.push(DamageInstance.create(5).setType('oil').setSource('WITCHER.Damage.oil'));
        }

        if (damageObject.properties.damageToAllLocations) {
            await this.applyDamageToAllLocations(dialogData, damageObject, damageInstances, derivedStat);
        } else {
            await this.applyDamageToLocation(dialogData, damageObject, damageInstances, derivedStat);
        }

        damageObject.properties.effects
            ?.filter(effect => effect.statusEffect)
            .filter(effect => effect.applied)
            .forEach(effect => applyStatusEffectToActor(this.uuid, effect.statusEffect, damageObject.duration));

        if (damageObject.itemUuid) {
            applyActiveEffectToActorViaId(this.uuid, damageObject.itemUuid, 'applyOnDamage', damageObject.duration);
        }
    },

    async handleShield(damageInstances) {
        let shield = this.system.derivedStats.shield.value;
        damageInstances.forEach(damageInstance => {
            if (damageInstance.damage < shield) {
                damageInstance.shielded = damageInstance.damage;
                damageInstance.damage = 0;
            } else {
                damageInstance.shielded = shield;
                damageInstance.damage -= shield;
            }
            shield = Math.max(shield - damageInstance.shielded, 0);
        });

        this.update({ 'system.derivedStats.shield.value': shield });

        if (shield > 0) {
            const messageTemplate = 'systems/TheWitcherTRPG/templates/chat/damage/shieldAbsorbs.hbs';

            const content = await foundry.applications.handlebars.renderTemplate(messageTemplate, {
                damageInstances: damageInstances.map(instance => instance.initialDamageText()).join(' + '),
                shield: this.system.derivedStats.shield.value
            });
            const chatData = {
                content: content,
                style: CONST.CHAT_MESSAGE_STYLES.OTHER,
                speaker: ChatMessage.getSpeaker({ actor: this })
            };
            ChatMessage.applyMode(chatData, game.settings.get('core', 'messageMode'));
            ChatMessage.create(chatData);
        }

        return damageInstances;
    },

    async applyDamageToLocation(dialogData, damageObject, damageInstances, derivedStat) {
        let damageResult = await this.calculateDamageWithLocation(dialogData, damageObject, damageInstances);

        if (damageResult.blockedBySp) {
            this.createDamageBlockedBySp(damageResult.damageInstances, damageResult.displaySP);
            return;
        }

        this.createDamageResultMessage(damageResult);
        await this.updateDerivedStat(
            damageInstances.reduce((acc, instance) => acc + instance.damage, 0),
            derivedStat
        );
    },

    async applyDamageToAllLocations(dialogData, damage, damageInstances, derivedStat) {
        let locations = this.getAllLocations().map(location => this.getLocationObject(location));

        let resultPromises = [];
        locations.forEach(location => {
            damage.location = location;

            resultPromises.push(this.calculateDamageWithLocation(dialogData, damage, damageInstances));
        });

        let results = await Promise.all(resultPromises);

        let totalAppliedDamage = results.reduce(
            (acc, result) =>
                acc + Math.floor(result.damageInstances.reduce((acc, instance) => acc + instance.damage, 0)),
            0
        );

        const messageTemplate = 'systems/TheWitcherTRPG/templates/chat/damage/damageToAllLocations.hbs';
        const templateContext = {
            results,
            totalAppliedDamage
        };

        const content = await foundry.applications.handlebars.renderTemplate(messageTemplate, templateContext);
        const chatData = {
            content: content,
            style: CONST.CHAT_MESSAGE_STYLES.OTHER
        };

        ChatMessage.applyMode(chatData, game.settings.get('core', 'messageMode'));
        let message = await ChatMessage.create(chatData);

        await this.updateDerivedStat(totalAppliedDamage, derivedStat);
    },

    async updateDerivedStat(damage, derivedStat) {
        damage = Math.floor(damage);
        //first subtract from temp health
        if (derivedStat == 'hp') {
            let tempHpArray = this.temporaryEffects.filter(ae =>
                ae.system.changes.find(change => change.key.includes('temporaryHp'))
            );
            for (let tempHp of tempHpArray) {
                for (let change of tempHp.system.changes) {
                    let changeContent = JSON.parse(change.value);
                    if (changeContent.value < damage) {
                        damage -= changeContent.value;
                        changeContent.value = 0;
                    } else {
                        changeContent.value -= damage;
                        damage = 0;
                    }
                    change.value = JSON.stringify(changeContent);
                }
                await tempHp.update({ changes: tempHp.system.changes });
            }
        }

        await this.update({
            [`system.derivedStats.${derivedStat}.value`]: this.system.derivedStats[derivedStat].value - damage
        });
    },

    async calculateDamageWithLocation(enemyData, damageProperties, damageInstances) {
        let properties = damageProperties.properties;
        let location = damageProperties.location;

        let locationArmor = this.getLocationArmor(location, properties);
        let armorSet = locationArmor.armorSet;
        let totalSP = locationArmor.totalSP;
        let displaySP = locationArmor.displaySP;

        if (properties.improvedArmorPiercing) {
            totalSP = Math.max(Math.ceil(totalSP / 2), 0);
            displaySP = Math.ceil(displaySP / 2);
        }

        if (game.settings.get('TheWitcherTRPG', 'silverTrait')) {
            if (properties?.silverTrait) {
                damageInstances[0].setType = 'silver';
            }
        } else {
            if (properties?.silverDamage && enemyData?.resistNonSilver) {
                let multi = damageProperties.strike === 'strong' ? '*2' : '';
                let silverRoll = await new Roll(damageProperties.properties.silverDamage + multi).evaluate();
                damageInstances.push(
                    DamageInstance.create(silverRoll.total).setType('silver').setSource('WITCHER.DamageType.silver')
                );
            }
        }

        damageInstances.forEach(instance => {
            if (instance.damage > totalSP) {
                instance.damage -= totalSP;
                totalSP = 0;
            } else {
                totalSP -= instance.damage;
                instance.damage = 0;
            }
            instance.afterSp = instance.damage;
        });

        let spDamage = await this.applyAlwaysSpDamage(location, properties, armorSet);

        if (!damageInstances.some(instance => instance.damage > 0)) {
            return {
                blockedBySp: true,
                damageInstances,
                displaySP,
                location,
                spDamage
            };
        }

        let flatDamageMod = this.getFlatDamageMod(damageProperties);

        if (flatDamageMod > 0) {
            damageInstances.push(DamageInstance.create(flatDamageMod).setSource('WITCHER.Damage.activeEffect'));
        }

        damageInstances.forEach(instance => {
            instance.damage = Math.max(Math.floor(location.formula * instance.damage), 0);
            instance.afterLocation = instance.damage;
        });

        damageInstances.forEach(instance => {
            let damageTypeConfig = CONFIG.WITCHER.damageTypes.find(type => type.value === instance.type);

            instance = this.calculateArmorResistances(instance, damageProperties, armorSet);

            //Enemy is suspectible to silver
            if (
                (enemyData?.resistNonSilver && !properties?.silverDamage && !damageTypeConfig.likeSilver) ||
                (enemyData?.resistNonMeteorite && !properties?.isMeteorite && !damageTypeConfig.likeMeteorite)
            ) {
                instance.damage = Math.floor(0.5 * instance.damage);
            }

            //Enemy is not suspectible to silver
            if (!enemyData?.resistNonSilver && instance.type === 'silver') {
                instance.damage = Math.floor(0.5 * instance.damage);
            }

            if (enemyData?.isVulnerable) {
                instance.damage *= 2;
            }

            instance.afterResistance = instance.damage;
        });

        spDamage += await this.applySpDamage(location, properties, armorSet);

        return {
            damageInstances,
            displaySP,
            properties,
            spDamage,
            location
        };
    },

    async createDamageBlockedBySp(damageInstances, displaySP) {
        const messageTemplate = 'systems/TheWitcherTRPG/templates/chat/damage/spAbsorbs.hbs';

        const content = await foundry.applications.handlebars.renderTemplate(messageTemplate, {
            initialDamage: damageInstances.map(instance => instance.initialDamageText()).join(' + '),
            displaySP: displaySP
        });
        const chatData = {
            content: content,
            style: CONST.CHAT_MESSAGE_STYLES.OTHER,
            speaker: ChatMessage.getSpeaker({ actor: this })
        };
        ChatMessage.applyMode(chatData, game.settings.get('core', 'messageMode'));
        ChatMessage.create(chatData);
    },

    async createDamageResultMessage(damageResult) {
        const messageTemplate = 'systems/TheWitcherTRPG/templates/chat/damage/damageToLocation.hbs';

        const damageInstances = damageResult.damageInstances;

        const content = await foundry.applications.handlebars.renderTemplate(messageTemplate, {
            damageProperties: damageResult.damageProperties,
            spDamage: damageResult.spDamage,
            displaySP: damageResult.displaySP,
            initialDamage: damageInstances.map(instance => instance.initialDamageText()).join(' + '),
            afterSPReduction: damageInstances.map(instance => instance.afterSpText()).join(' + '),
            afterLocation: damageInstances.map(instance => instance.afterLocationText()).join(' + '),
            afterResistance: damageInstances.map(instance => instance.afterResistanceText()).join(' + '),
            finalDamage: damageInstances.map(instance => instance.damageText()).join(' + ')
        });
        const chatData = {
            content: content,
            speaker: ChatMessage.getSpeaker({ actor: this }),
            style: CONST.CHAT_MESSAGE_STYLES.OTHER
        };

        ChatMessage.applyMode(chatData, game.settings.get('core', 'messageMode'));
        ChatMessage.create(chatData);
    },

    async applyCritDamage(crit) {
        this.applyDamage(
            null,
            [DamageInstance.create(crit.critdamage).setSource('Types.Item.criticalWound')],
            {
                properties: { bypassesNaturalArmor: true, bypassesWornArmor: true },
                location: this.getLocationObject('torso')
            },
            'hp'
        );
    },

    async applyBonusCritDamage(crit) {
        this.applyDamage(
            null,
            [DamageInstance.create(crit.bonusdamage).setSource('Types.Item.criticalWound')],
            {
                properties: { bypassesNaturalArmor: true, bypassesWornArmor: true },
                location: this.getLocationObject('torso')
            },
            'hp'
        );
    },

    async applyCritWound(crit) {
        let location = crit.location;

        let possibleWounds = game.packs
            .get(game.settings.get('TheWitcherTRPG', 'criticalWoundsPack'))
            .index.filter(criticalWound => criticalWound.system.treatment == 'none')
            .filter(criticalWound => criticalWound.system.location == location.name)
            .filter(criticalWound => criticalWound.system.criticalLevel == crit.criticalLevel);

        let wound;

        if (possibleWounds.length == 1) {
            wound = possibleWounds[0];
        } else {
            let woundRoll = crit.location.critEffect ?? getRandomInt(6) + crit.critEffectModifier;
            if (woundRoll > 4) {
                wound = possibleWounds.find(criticalWound => criticalWound.system.lesserEffect === false);
            } else {
                wound = possibleWounds.find(criticalWound => criticalWound.system.lesserEffect === true);
            }
        }

        //convert index to real item
        wound = await fromUuid(wound.uuid);
        this.addItem(wound);

        const chatData = {
            content: `<div>${wound.name}</div><div>${wound.system.description}</div>`,
            speaker: ChatMessage.getSpeaker({ actor: this }),
            style: CONST.CHAT_MESSAGE_STYLES.OTHER
        };
        ChatMessage.create(chatData);
    },

    calculateHealingTime(criticalLevel) {
        switch (criticalLevel) {
            case 'simple':
                return Math.max(8 - this.system.stats.body.max, 1);
            case 'complex':
                return Math.max(12 - this.system.stats.body.max, 1);
            case 'difficult':
                return Math.max(15 - this.system.stats.body.max, 1);
        }
    }
};
