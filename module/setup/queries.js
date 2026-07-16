import {
    applyActiveEffectToActor,
    applyActiveEffectToActorViaId
} from '../scripts/temporaryEffects/applyActiveEffect.js';
import { applyStatusEffectToActor } from '../scripts/statusEffects/applyStatusEffect.js';

const system = 'TheWitcherTRPG';

async function applyTemporaryItemImprovementsToActor(queryData, { timeout }) {
    let actor = fromUuidSync(queryData.actorUuid);
    actor.applyTemporaryItemImprovements(queryData.effects);
    return true;
}

async function query(queryData, { timeout }) {
    let callableFunctions = {
        applyStatusEffectToActor,
        applyActiveEffectToActor,
        applyActiveEffectToActorViaId
    };

    let callableEntityFunctions = [
        //Actor
        'addItem',
        'applyTemporaryItemImprovements',
        'addAdrenaline',
        //Item
        'restoreReliability',
        //Region
        'addBehaviorsToRegionUuids'
    ];

    if (queryData.function in callableFunctions) {
        callableFunctions[queryData.function](...queryData.data);
        return true;
    }

    if (callableEntityFunctions.includes(queryData.function)) {
        let entity = fromUuidSync(queryData.uuid);
        entity[queryData.function]?.(...queryData.data);
        entity.system[queryData.function]?.(...queryData.data);
        return true;
    }

    return false;
}

export function registerQueries() {
    CONFIG.queries[`${system}.applyTemporaryItemImprovements`] = applyTemporaryItemImprovementsToActor;
    CONFIG.queries[`${system}.query`] = query;
}
