export let modifierMixin = {
    addActiveEffects(skillName) {
        let displayRollDetails = game.settings.get('TheWitcherTRPG', 'displayRollsDetails');
        let skill = CONFIG.WITCHER.skillMap[skillName];

        let formula = '';

        if (!skill) return formula;

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
                    formula += ` +${modifier.value}[${game.i18n.localize(modifier.name)}]`;
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
