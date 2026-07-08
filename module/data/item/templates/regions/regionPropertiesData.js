import regionBehaviours from './regionBehavioursData.js';

const fields = foundry.data.fields;

export default class RegionProperties extends foundry.abstract.DataModel {
    static defineSchema() {
        return {
            behaviours: new fields.SchemaField(regionBehaviours())
        };
    }

    async addBehaviorsToRegionUuids(regionUuids) {
        this.addBehaviorsToRegions(regionUuids.map(uuid => fromUuidSync(uuid)));
    }

    async addBehaviorsToRegions(regions) {
        let item = this.parent.parent;
        if (!game.user.isGM) {
            game.users.activeGM.query('TheWitcherTRPG.query', {
                function: 'addBehaviorsToRegionUuids',
                uuid: item.uuid,
                data: [regions.map(template => template.uuid)]
            });
            return;
        }
        regions.forEach(region => {
            let behaviors = [];

            Object.keys(this.behaviours)
                .filter(key => this.behaviours[key])
                .forEach(key => behaviors.push(this.createRegionBehaviour(key, this.behaviours[key])));

            region.update({
                behaviors: behaviors
            });
        });
    }

    createRegionBehaviour(event, uuid) {
        return {
            name: 'Execute Macro on ' + event,
            type: 'executeMacro',
            system: {
                events: [event],
                uuid: uuid
            }
        };
    }

    /** @inheritdoc */
    static migrateData(source) {
        source.behaviours.tokenMoveWithin = source.behaviours.tokenPreMove;

        return super.migrateData(source);
    }
}
