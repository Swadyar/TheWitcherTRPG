export let armorMixin = {
    getArmorEcumbrance() {
        let encumbranceModifier = -this.system.lifepathModifiers.ignoredArmorEncumbrance;
        let armors = this.items.filter(item => item.type == 'armor' && item.system.equipped);
        armors.forEach(item => {
            encumbranceModifier += item.system.encumb;
        });

        return Math.max(encumbranceModifier, 0);
    },

    getLocationArmor(location, properties) {
        let armors = this.getList('armor').filter(a => a.system.equipped);

        let headArmors = armors.filter(h => h.system.head.modifiedMaxStoppingPower > 0);
        let torsoArmors = armors.filter(t => t.system.torso.modifiedMaxStoppingPower > 0);
        let leftArmArmors = armors.filter(t => t.system.leftArm.modifiedMaxStoppingPower > 0);
        let rightArmArmors = armors.filter(t => t.system.rightArm.modifiedMaxStoppingPower > 0);
        let leftLegArmors = armors.filter(l => l.system.leftLeg.modifiedMaxStoppingPower > 0);
        let rightLegArmors = armors.filter(l => l.system.rightLeg.modifiedMaxStoppingPower > 0);

        let armorSet;
        let totalSP = 0;
        let displaySP = '';

        //get armor set and add natural armor
        switch (location.name) {
            case 'head':
                armorSet = this.getArmors(headArmors);
                totalSP += this.system.armorHead ?? 0;
                displaySP += this.system.armorHead > 0 ? this.system.armorHead + ' + ' : '';
                break;
            case 'torso':
                armorSet = this.getArmors(torsoArmors);
                totalSP += this.system.armorUpper ?? 0;
                displaySP += this.system.armorUpper > 0 ? this.system.armorUpper + ' + ' : '';
                break;
            case 'rightArm':
                armorSet = this.getArmors(rightArmArmors);
                totalSP += this.system.armorUpper ?? 0;
                displaySP += this.system.armorUpper > 0 ? this.system.armorUpper + ' + ' : '';
                break;
            case 'leftArm':
                armorSet = this.getArmors(leftArmArmors);
                totalSP += this.system.armorUpper ?? 0;
                displaySP += this.system.armorUpper > 0 ? this.system.armorUpper + ' + ' : '';
                break;
            case 'rightLeg':
                armorSet = this.getArmors(rightLegArmors);
                totalSP += this.system.armorLower ?? 0;
                displaySP += this.system.armorLower > 0 ? this.system.armorLower + ' + ' : '';
                break;
            case 'leftLeg':
                armorSet = this.getArmors(leftLegArmors);
                totalSP += this.system.armorLower ?? 0;
                displaySP += this.system.armorLower > 0 ? this.system.armorLower + ' + ' : '';
                break;
            case 'tailWing':
                armorSet = this.getArmors([]);
                totalSP += this.system.armorTailWing ?? 0;
                displaySP += this.system.armorTailWing > 0 ? this.system.armorTailWing + ' + ' : '';
                break;
        }

        //if natural armor is ignored, reset it to 0
        if (properties.bypassesNaturalArmor) {
            //reset SP when bypassing monster natural armor
            totalSP = 0;
            displaySP = '';
        }

        //add worn armor
        displaySP += this.getArmorSp(armorSet, location.name, properties).displaySP;
        totalSP += this.getArmorSp(armorSet, location.name, properties).totalSP;

        if (!displaySP) {
            displaySP = '0';
        }

        return {
            armorSet,
            totalSP,
            displaySP
        };
    },

    getArmors(armors) {
        let lightCount = 0,
            mediumCount = 0,
            heavyCount = 0;
        let lightArmor, mediumArmor, heavyArmor, naturalArmor;
        armors.forEach(item => {
            if (item.system.type == 'Light') {
                lightCount++;
                lightArmor = item;
            }
            if (item.system.type == 'Medium') {
                mediumCount++;
                mediumArmor = item;
            }
            if (item.system.type == 'Heavy') {
                heavyCount++;
                heavyArmor = item;
            }
            if (item.system.type == 'Natural') {
                naturalArmor = item;
            }
        });

        if (lightCount > 1 || mediumCount > 1 || heavyCount > 1) {
            ui.notifications.error(game.i18n.localize('WITCHER.Armor.tooMuch'));
            return;
        }

        return {
            lightArmor: lightArmor,
            mediumArmor: mediumArmor,
            heavyArmor: heavyArmor,
            naturalArmor: naturalArmor
        };
    },

    getArmorSp(armorSet, location, properties) {
        return this.getStackedArmorSp(
            armorSet['lightArmor']?.system[location].modifiedStoppingPower,
            armorSet['mediumArmor']?.system[location].modifiedStoppingPower,
            armorSet['heavyArmor']?.system[location].modifiedStoppingPower,
            armorSet['naturalArmor']?.system[location].modifiedStoppingPower,
            properties
        );
    },

    getStackedArmorSp(lightArmorSP, mediumArmorSP, heavyArmorSP, naturalArmorSP, properties) {
        let totalSP = 0;
        let displaySP = '';

        if (!properties.bypassesWornArmor) {
            if (heavyArmorSP) {
                totalSP = heavyArmorSP;
                displaySP = heavyArmorSP;
            }

            if (mediumArmorSP) {
                if (heavyArmorSP) {
                    let diff = this.getArmorDiffBonus(heavyArmorSP, mediumArmorSP);
                    totalSP = Number(totalSP) + Number(diff);
                    displaySP += ' +' + diff;
                } else {
                    displaySP = mediumArmorSP;
                    totalSP = mediumArmorSP;
                }
            }

            if (lightArmorSP) {
                if (mediumArmorSP) {
                    let diff = this.getArmorDiffBonus(mediumArmorSP, lightArmorSP);
                    totalSP = Number(totalSP) + Number(diff);
                    displaySP += ` +${diff}[${game.i18n.localize('WITCHER.Armor.LayerBonus')}]`;
                } else if (heavyArmorSP) {
                    let diff = this.getArmorDiffBonus(heavyArmorSP, lightArmorSP);
                    totalSP = Number(totalSP) + Number(diff);
                    displaySP += ` +${diff}[${game.i18n.localize('WITCHER.Armor.LayerBonus')}]`;
                } else {
                    displaySP = lightArmorSP;
                    totalSP = lightArmorSP;
                }
            }
        }

        if (naturalArmorSP && !properties.bypassesNaturalArmor) {
            totalSP += naturalArmorSP;
            displaySP += ` +${naturalArmorSP} [${game.i18n.localize('WITCHER.Armor.Natural')}]`;
        }

        return {
            displaySP,
            totalSP
        };
    },

    getArmorDiffBonus(overArmor, underArmor) {
        let diff = overArmor - underArmor;

        if (underArmor <= 0 || overArmor <= 0) {
            return 0;
        }

        if (diff < 0) {
            diff *= -1;
        }

        if (diff > 20) {
            return 0;
        } else if (diff > 15) {
            return 2;
        } else if (diff > 9) {
            return 3;
        } else if (diff > 5) {
            return 4;
        } else if (diff >= 0) {
            return 5;
        }
        return 0;
    },

    calculateArmorResistances(totalDamage, damage, armorSet) {
        let properties = damage.properties;
        if (properties.armorPiercing || properties.improvedArmorPiercing) {
            return totalDamage;
        }

        let damageAfterResistances = totalDamage;

        if (
            !properties.bypassesWornArmor &&
            (armorSet['lightArmor']?.system.resistance[damage.type] ||
                armorSet['mediumArmor']?.system.resistance[damage.type] ||
                armorSet['heavyArmor']?.system.resistance[damage.type])
        ) {
            damageAfterResistances = Math.floor(0.5 * totalDamage);
        }

        if (armorSet['naturalArmor']?.system.resistance[damage.type] && !properties.bypassesNaturalArmor) {
            damageAfterResistances = Math.floor(0.5 * totalDamage);
        }

        let damageMulti = this.getMultiDamageMod(damage);

        damageAfterResistances = Math.floor(damageAfterResistances * damageMulti);

        return damageAfterResistances;
    },

    async applySpDamage(location, properties, armorSet) {
        if (properties.bypassesWornArmor) {
            //damage bypasses armor so no SP damage
            return 0;
        }

        let spDamage = properties.ablating ? Math.floor((await new Roll('1d6/2+1').evaluate()).total) : 1;

        if (properties.crushingForce) {
            spDamage *= 2;
        }

        this.applySpDamageToItemArmor(armorSet, location, spDamage);
        this.applySpDamageToMonsterArmor(location, properties, spDamage);

        return spDamage;
    },

    async applyAlwaysSpDamage(location, properties, armorSet) {
        let spDamage = properties.spDamage ?? 0;

        this.applySpDamageToItemArmor(armorSet, location, spDamage);
        this.applySpDamageToMonsterArmor(location, properties, spDamage);

        return spDamage;
    },

    async applySpDamageToItemArmor(armorSet, location, spDamage) {
        armorSet['lightArmor']?.system.applySpDamage(location, spDamage);
        armorSet['mediumArmor']?.system.applySpDamage(location, spDamage);
        armorSet['heavyArmor']?.system.applySpDamage(location, spDamage);
    },

    async applySpDamageToMonsterArmor(location, properties, spDamage) {
        if (properties.bypassesNaturalArmor) return;
        if (this.type != 'monster') return;

        switch (location.name) {
            case 'head':
                this.update({ [`system.armorHead`]: Math.max(this.system.armorHead - spDamage, 0) });
                break;
            case 'torso':
            case 'rightArm':
            case 'leftArm':
                this.update({ [`system.armorUpper`]: Math.max(this.system.armorUpper - spDamage, 0) });
                break;
            case 'rightLeg':
            case 'leftLeg':
                this.update({ [`system.armorLower`]: Math.max(this.system.armorLower - spDamage, 0) });
                break;
            case 'tailWing':
                this.update({ [`system.armorTailWing`]: Math.max(this.system.armorTailWing - spDamage, 0) });
                break;
        }
    }
};
