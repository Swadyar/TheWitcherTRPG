export let criticalWoundMixin = {
    async _onCriticalWoundAdd(event) {
        event.preventDefault();
        this.actor.createEmbeddedDocuments('Item', [
            {
                name: game.i18n.localize('TYPES.Item.criticalWound'),
                type: 'criticalWound'
            }
        ]);
    },

    async _onTreat(event) {
        event.preventDefault();

        const crit = fromUuidSync(event.target.dataset.id);
        crit.system.treat();
    },

    criticalWoundListener(html) {
        html.querySelectorAll('.add-crit').forEach(el =>
            el.addEventListener('click', event => this._onCriticalWoundAdd(event))
        );
        html.querySelectorAll('.delete-crit').forEach(el =>
            el.addEventListener('click', event => this._onCriticalWoundRemove(event))
        );

        html.querySelectorAll('[data-action=treatCriticalWound]').forEach(crit =>
            crit.addEventListener('click', event => this._onTreat(event))
        );
    }
};

