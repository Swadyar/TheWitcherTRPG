export let modifierMixin = {
    addAllModifiers(skillName) {
        let modifierFormula = '';
        modifierFormula += this.addSkillModifiers(skillName);
        return modifierFormula;
    },

    addSkillModifiers(skillName) {
        let displayRollDetails = game.settings.get('TheWitcherTRPG', 'displayRollsDetails');
        let skill = CONFIG.WITCHER.skillMap[skillName];

        let formula = '';

        if (!skill) return formula;

        this.system.skills[skill.attribute.name][skill.name].modifiers?.forEach(mod => {
            if (mod.value < 0) {
                formula += !displayRollDetails ? ` ${mod.value}` : ` ${mod.value}[${mod.name}]`;
            }
            if (mod.value > 0) {
                formula += !displayRollDetails ? ` +${mod.value}` : ` +${mod.value}[${mod.name}]`;
            }
        });

        if (this.system.skills[skill.attribute.name][skill.name].activeEffectModifiers != 0) {
            let effects = this.appliedEffects
                .filter(e =>
                    e.system.changes.some(
                        c => c.key === `system.skills.${skill.attribute.name}.${skill.name}.activeEffectModifiers`
                    )
                )
                .map(effect => effect.name)
                .join(' & ');
            formula += !displayRollDetails
                ? ` +${this.system.skills[skill.attribute.name][skill.name].activeEffectModifiers}`
                : ` +${this.system.skills[skill.attribute.name][skill.name].activeEffectModifiers}[${effects}]`;
        }

        if (this.system.skillGroupModifiers) {
            Object.values(this.system.skillGroupModifiers).forEach(modifier => {
                if (
                    modifier.group === 'allSkills' ||
                    CONFIG.WITCHER[modifier.group].some(groupSkill => groupSkill === skill.name)
                ) {
                    if (modifier.value < 0) {
                        formula += ` ${modifier.value}[${game.i18n.localize(modifier.name)}]`;
                    }
                    if (modifier.value > 0) {
                        formula += ` +${modifier.value}[${game.i18n.localize(modifier.name)}]`;
                    }
                } else {
                }
            });
        }

        return formula;
    },

    addAttackModifiers() {
        let modifiers = '';
        Object.values(this.system.combatEffects.attackModifier).forEach(mod => {
            modifiers += mod.value !== 0 ? ` ${mod.value}[${game.i18n.localize(mod.name)}]` : '';
        });
        return modifiers;
    },

    addDefenseModifiers() {
        let modifiers = '';
        Object.values(this.system.combatEffects.defenseModifier).forEach(mod => {
            modifiers += mod.value !== 0 ? ` ${mod.value}[${game.i18n.localize(mod.name)}]` : '';
        });
        return modifiers;
    }
};
