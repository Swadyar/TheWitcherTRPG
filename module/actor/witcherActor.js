import { getRandomInt } from '../scripts/helper.js';
import { WITCHER } from '../setup/config.js';
import { modifierMixin } from './mixins/modifierMixin.js';
import { damageUtilMixin } from './mixins/damageUtilMixin.js';
import { castSpellMixin } from './mixins/castSpellMixin.js';
import { locationMixin } from './mixins/locationMixin.js';
import { weaponAttackMixin } from './mixins/weaponAttackMixin.js';
import { verbalCombatMixin } from './mixins/verbalCombatMixin.js';
import { defenseMixin } from './mixins/defenseMixin.js';
import { damageMixin } from './mixins/damageMixin.js';
import { temporaryEffectMixin } from './mixins/temporaryEffectMixin.js';
import { professionMixin } from './mixins/professionMixin.js';
import { armorMixin } from './mixins/armorMixin.js';
import { healMixin } from './mixins/healMixin.js';
import { rewardsMixin } from './mixins/rewardsMixin.js';
import { craftingMixin } from './mixins/craftingMixin.js';
import { currencyConverterMixin } from './mixins/currencyConverterMixin.js';
import { adrenalineMixin } from './mixins/adrenalineMixin.js';
import { skillMixin } from './mixins/skillMixin.js';

export default class WitcherActor extends Actor {
    /**
     * An array of ActiveEffect instances which are present on the Actor or Items which have a limited duration.
     * @type {ActiveEffect[]}
     */
    get temporaryEffects() {
        let temporaryEffects = super.temporaryEffects;

        let temporaryItemImprovements = this.items
            .map(item => item.effects.filter(effect => effect.isAppliedTemporaryItemImprovement))
            .flat();
        return temporaryEffects.concat(temporaryItemImprovements);
    }

    prepareDerivedData() {
        super.prepareDerivedData();

        if (this.type === 'loot') return;
        if (this.type === 'mystery') return;

        let armorEffects = this.getList('armor')
            .filter(armor => armor.system.equipped)
            .map(armor => armor.system.effects)
            .flat()
            .filter(effect => effect.statusEffect)
            .map(effect => WITCHER.armorEffects.find(armorEffect => armorEffect.id == effect.statusEffect));
        this.applyStatus(armorEffects);

        this.calculateStats();
        this.calculateFixedDerivedStats();
        this.calculateStats();
        this.calculateDerivedStats();
        this.calculateAttackStats();
    }

    calculateStats() {
        this.calculateStat('int');
        this.calculateStat('ref');
        this.calculateStat('dex');
        this.calculateStat('body');
        this.calculateStat('spd');
        this.calculateStat('emp');
        this.calculateStat('cra');
        this.calculateStat('will');

        this.system.stats.toxicity.max += this.system.stats.toxicity.totalModifiers;
        this.system.stats.luck.max += this.system.stats.luck.totalModifiers;
        this.system.reputation.value = this.system.reputation.max;
    }

    calculateStat(stat) {
        let totalModifiers = this.system.stats[stat].totalModifiers;

        //Adjust for encumbrance
        if (stat === 'ref' || stat === 'dex' || stat === 'spd') {
            if (stat === 'ref' || stat === 'dex') {
                let armorEnc = this.getArmorEcumbrance();
                totalModifiers += -armorEnc - this.calculateWeigthEncumbrance();
            }

            totalModifiers -= this.calculateWeigthEncumbrance();
        }

        let divider = 1;

        //Adjust for hp
        let HPvalue = this.system.derivedStats.hp.value;
        let { deathState, woundThreshold } = this.system.healthState;

        deathState.applied = false;
        if (!deathState.ignored && HPvalue <= 0) {
            deathState.applied = true;
            divider += 2;
        } else {
            woundThreshold.applied = false;

            let isWounded = !woundThreshold.ignored && HPvalue < this.system.derivedStats.woundTreshold.value;
            if (isWounded) {
                woundThreshold.applied = true;
                if (stat === 'ref' || stat === 'dex' || stat === 'int' || stat === 'will') {
                    divider += 1;
                }
            }
        }

        this.system.stats[stat].value = Math.floor((this.system.stats[stat].unmodifiedMax + totalModifiers) / divider);
    }

    calculateWeigthEncumbrance() {
        let bodyTotalModifiers = this.system.stats.body.totalModifiers;
        let currentEncumbrance =
            (this.system.stats.body.max + bodyTotalModifiers) * 10 + this.system.derivedStats.enc.totalModifiers;
        var totalWeights = this.getTotalWeight();

        let encDiff = 0;
        if (currentEncumbrance < totalWeights) {
            encDiff = Math.ceil((totalWeights - currentEncumbrance) / 5);
        }

        return encDiff;
    }

    calculateFixedDerivedStats() {
        const base = Math.floor((this.system.stats.body.value + this.system.stats.will.value) / 2);
        const baseMax = Math.floor((this.system.stats.body.max + this.system.stats.will.max) / 2);

        this.system.derivedStats.stun.value = Math.clamp(base, 1, 10) + this.system.derivedStats.stun.totalModifiers;
        this.system.derivedStats.stun.max = Math.clamp(baseMax, 1, 10);

        this.system.derivedStats.run.value =
            this.system.stats.spd.value * 3 + this.system.derivedStats.run.totalModifiers;
        this.system.derivedStats.run.max = this.system.stats.spd.value * 3;

        this.system.derivedStats.leap.value = Math.floor(
            (this.system.stats.spd.value * 3) / 5 + this.system.derivedStats.leap.totalModifiers
        );
        this.system.derivedStats.leap.max = Math.floor((this.system.stats.spd.max * 3) / 5);

        this.system.derivedStats.enc.value =
            this.system.stats.body.value * 10 + this.system.derivedStats.enc.totalModifiers;
        this.system.derivedStats.enc.max = this.system.stats.body.value * 10;

        this.system.derivedStats.rec.value = base + this.system.derivedStats.rec.totalModifiers;
        this.system.derivedStats.rec.max = baseMax;

        this.system.derivedStats.woundTreshold.value = baseMax + this.system.derivedStats.woundTreshold.totalModifiers;
        this.system.derivedStats.woundTreshold.max = baseMax;
    }

    calculateDerivedStats() {
        this.calculateDerivedStat('hp');
        this.calculateDerivedStat('sta');
        this.calculateDerivedStat('resolve');
        this.calculateDerivedStat('focus');
        this.calculateDerivedStat('vigor');
    }

    calculateDerivedStat(stat) {
        let totalModifiers = this.system.derivedStats[stat].totalModifiers;
        let divider = 1;

        const base = Math.floor((this.system.stats.body.value + this.system.stats.will.value) / 2);
        if (!this.system.customStat && (stat === 'hp' || stat === 'sta')) {
            this.system.derivedStats[stat].unmodifiedMax = base * 5;
        }

        let modifiedMax = this.system.derivedStats[stat].unmodifiedMax + totalModifiers;

        if (stat === 'resolve' || stat === 'focus') {
            divider += 1;
        }

        if (!this.system.customStat) {
            if (stat === 'hp' || stat === 'sta') {
                modifiedMax = Math.floor((base * 5 + totalModifiers) / divider);
            } else if (stat === 'resolve') {
                modifiedMax =
                    Math.floor((this.system.stats.will.value + this.system.stats.int.value) / divider) * 5 +
                    totalModifiers;
            } else if (stat === 'focus') {
                modifiedMax =
                    Math.floor((this.system.stats.will.value + this.system.stats.int.value) / divider) * 3 +
                    totalModifiers;
            }
        }

        this.system.derivedStats[stat].max = modifiedMax;
        this.system.derivedStats[stat].totalModifiers = totalModifiers;
    }

    calculateAttackStats() {
        const meleeBonus = Math.ceil((this.system.stats.body.value - 6) / 2) * 2;
        this.system.attackStats.meleeBonus += meleeBonus;
        this.system.attackStats.punch.value = `1d6+${meleeBonus}`;
        this.system.attackStats.kick.value = `1d6+${4 + meleeBonus}`;
    }

    async applyStatus(effects) {
        effects
            ?.filter(effect => !!effect.statusEffect)
            .forEach(effect => {
                if (!this.statuses.find(status => status == effect.statusEffect)) {
                    this.toggleStatusEffect(effect.statusEffect);
                }

                if (this.system.statusEffectImmunities?.find(immunity => immunity == statusEffectId)) {
                    //untoggle it so people see it was tried to be applied but failed
                    setTimeout(() => {
                        this.toggleStatusEffect(statusEffectId);
                    }, 1000);
                }
            });
    }

    async removeStatus(effects) {
        effects
            .filter(effect => !!effect.statusEffect)
            .forEach(effect => {
                if (this.statuses.find(status => status == effect.statusEffect)) {
                    this.toggleStatusEffect(effect.statusEffect);
                }
            });
    }

    async useItem(itemId, options) {
        let item = this.items.get(itemId);

        if (!item) return;

        if (item.type === 'weapon') {
            return this.weaponAttack(item, options);
        }

        if (item.type === 'spell' || item.type === 'hex' || item.type === 'ritual') {
            return this.castSpell(item);
        }

        if (item.isConsumable) {
            item.consume();
            this.removeItem(item.id, 1);
            return;
        }
    }

    getTotalWeight() {
        let total = this.items.reduce((total, item) => (total += item.system.calcWeight?.() ?? 0), 0);
        return Math.ceil(total + this.system.calcCurrencyWeight());
    }

    getList(name) {
        if (name === 'shield') {
            return this.items
                .filter(item => item.type == 'armor' && item.system.location == 'Shield')
                .sort((a, b) => a.sort - b.sort);
        }
        return this.items.filter(i => i.type == name && !i.system.isStored).sort((a, b) => a.sort - b.sort);
    }

    async addItem(addItem, numberOfItem = 1, forcecreate = false) {
        let foundItem = this.items.find(item => item.name == addItem.name && item.type == addItem.type);
        if (foundItem && !forcecreate && !foundItem.system.isStored) {
            await foundItem.update({ 'system.quantity': Number(foundItem.system.quantity) + Number(numberOfItem) });
        } else {
            //if toObject cannot be called, we dont have a source => we dont need to call toObject
            let newItem = addItem.toObject ? addItem.toObject() : addItem;

            if (numberOfItem) {
                newItem.system.quantity = Number(numberOfItem);
            }

            await this.createEmbeddedDocuments('Item', [newItem]);
        }
    }

    async removeItem(itemId, quantityToRemove) {
        let foundItem = this.items.get(itemId);
        let newQuantity = foundItem.system.quantity - quantityToRemove;
        if (newQuantity <= 0) {
            await this.items.get(itemId).delete();
        } else {
            await foundItem.update({ 'system.quantity': newQuantity });
        }
    }

    async removeItemsOfType(type) {
        this.deleteEmbeddedDocuments(
            'Item',
            this.items.filter(item => item.type === type).map(item => item.id)
        );
    }

    static getAllLocations() {
        let locations = ['head', 'torso', 'rightArm', 'leftArm', 'rightLeg', 'leftLeg'];

        if (this.type == 'monster' && this.system.hasTailWing) {
            locations.push('tailWing');
        }

        return locations;
    }

    static getLocationObject(location) {
        let alias = '';
        let modifier = `+0`;
        let formula;
        switch (location) {
            case 'randomHuman':
                let randomHumanLocation = getRandomInt(10);
                switch (randomHumanLocation) {
                    case 1:
                        location = 'head';
                        formula = 3;
                        break;
                    case 2:
                    case 3:
                    case 4:
                        location = 'torso';
                        formula = 1;
                        break;
                    case 5:
                        location = 'rightArm';
                        formula = 0.5;
                        break;
                    case 6:
                        location = 'leftArm';
                        formula = 0.5;
                        break;
                    case 7:
                    case 8:
                        location = 'rightLeg';
                        formula = 0.5;
                        break;
                    case 9:
                    case 10:
                        location = 'leftLeg';
                        formula = 0.5;
                        break;
                    default:
                        location = 'torso';
                        formula = 1;
                        break;
                }
                alias = `${game.i18n.localize('WITCHER.Location.Random')}`;
                break;
            case 'randomMonster':
                let randomMonsterLocation = getRandomInt(10);
                switch (randomMonsterLocation) {
                    case 1:
                        location = 'head';
                        formula = 3;
                        break;
                    case 2:
                    case 3:
                    case 4:
                    case 5:
                        location = 'torso';
                        formula = 1;
                        break;
                    case 6:
                    case 7:
                        location = 'rightLeg';
                        formula = 0.5;
                        break;
                    case 8:
                    case 9:
                        location = 'leftLeg';
                        formula = 0.5;
                        break;
                    case 10:
                        location = 'tailWing';
                        formula = 0.5;
                        break;
                    default:
                        location = 'torso';
                        formula = 1;
                        break;
                }
                alias = `${game.i18n.localize('WITCHER.Location.Random')}`;
                break;
            case 'head':
                alias = `${game.i18n.localize('WITCHER.Armor.LocationHead')}`;
                formula = 3;
                modifier = `-6`;
                break;
            case 'torso':
                alias = `${game.i18n.localize('WITCHER.Armor.LocationTorso')}`;
                formula = 1;
                modifier = `-1`;
                break;
            case 'rightArm':
                alias = `${game.i18n.localize('WITCHER.Armor.LocationRight')} ${game.i18n.localize(
                    'WITCHER.Armor.LocationArm'
                )}`;
                formula = 0.5;
                modifier = `-3`;
                break;
            case 'leftArm':
                alias = `${game.i18n.localize('WITCHER.Armor.LocationLeft')} ${game.i18n.localize(
                    'WITCHER.Armor.LocationArm'
                )}`;
                formula = 0.5;
                modifier = `-3`;
                break;
            case 'rightLeg':
                alias = `${game.i18n.localize('WITCHER.Armor.LocationRight')} ${game.i18n.localize(
                    'WITCHER.Armor.LocationLeg'
                )}`;
                formula = 0.5;
                modifier = `-2`;
                break;
            case 'leftLeg':
                alias = `${game.i18n.localize('WITCHER.Armor.LocationLeft')} ${game.i18n.localize(
                    'WITCHER.Armor.LocationLeg'
                )}`;
                formula = 0.5;
                modifier = `-2`;
                break;
            case 'tailWing':
                alias = `${game.i18n.localize('WITCHER.Dialog.attackTail')}`;
                formula = 0.5;
                break;
            default:
                alias = `${game.i18n.localize('WITCHER.Armor.LocationTorso')}`;
                formula = 1;
                modifier = `-1`;
                break;
        }

        return {
            name: location,
            alias: alias,
            formula: formula,
            modifier: modifier
        };
    }
}

Object.assign(WitcherActor.prototype, professionMixin);
Object.assign(WitcherActor.prototype, modifierMixin);
Object.assign(WitcherActor.prototype, damageMixin);
Object.assign(WitcherActor.prototype, damageUtilMixin);
Object.assign(WitcherActor.prototype, weaponAttackMixin);
Object.assign(WitcherActor.prototype, defenseMixin);
Object.assign(WitcherActor.prototype, healMixin);
Object.assign(WitcherActor.prototype, castSpellMixin);
Object.assign(WitcherActor.prototype, verbalCombatMixin);
Object.assign(WitcherActor.prototype, locationMixin);
Object.assign(WitcherActor.prototype, temporaryEffectMixin);
Object.assign(WitcherActor.prototype, armorMixin);
Object.assign(WitcherActor.prototype, rewardsMixin);
Object.assign(WitcherActor.prototype, craftingMixin);
Object.assign(WitcherActor.prototype, currencyConverterMixin);
Object.assign(WitcherActor.prototype, adrenalineMixin);
Object.assign(WitcherActor.prototype, skillMixin);
