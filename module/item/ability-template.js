export default class AbilityTemplate extends foundry.canvas.placeables.Region {
    /**
     * A factory method to create an AbilityTemplate instance using provided data from an Item instance
     * @param {Item} item               The Item object for which to construct the template
     * @param {object} [options={}]       Options to modify the created template.
     * @returns {AbilityTemplate|null}    The template object, or null if the item does not produce a template
     */
    static fromItem(item, options = {}) {
        const shapeType = item.system.templateProperties.templateType;
        if (!shapeType) return null;

        const grid = canvas.scene?.grid;
        // Prepare template data

        const regionData = foundry.utils.mergeObject(
            {
                name: item.name,
                uuid: item.uuid,
                user: game.user.id,
                color: game.user?.color || '#ff0000',
                shapes: [],
                elevation: { bottom: 0, top: null },
                restriction: { enabled: false, type: 'move', priority: 0 },
                behaviors: [],
                visibility: CONST.REGION_VISIBILITY.ALWAYS,
                displayMeasurements: true,
                locked: false,
                ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE },
                flags: { witcher: { origin: item.uuid } }
            },
            options
        );

        const templateSize = (item.system.templateProperties.templateSize * grid.size) / grid.distance;
        let gridBased = !grid.isGridless;
        const x = 0;
        const y = 0;
        const direction = 0;

        let shape;
        switch (shapeType) {
            case 'circle':
                shape = { type: 'circle', x, y, radius: templateSize, gridBased };
                break;
            case 'cone': {
                const curvature = 'flat';
                shape = {
                    type: 'cone',
                    x,
                    y,
                    radius: templateSize,
                    angle: 90,
                    rotation: direction,
                    curvature,
                    gridBased
                };
                break;
            }
            case 'rect': {
                let rectWidth = templateSize;
                let rectHeight = templateSize;
                const rotation = direction.toNearest(90, 'floor');
                shape = {
                    type: 'rectangle',
                    x,
                    y,
                    width: rectWidth,
                    height: rectHeight,
                    anchorX: 0,
                    anchorY: 0,
                    rotation,
                    gridBased
                };
                break;
            }
            case 'ray':
                shape = {
                    type: 'line',
                    x,
                    y,
                    length: templateSize ?? canvas.dimensions.distance,
                    width: grid.size,
                    rotation: direction,
                    gridBased
                };
                break;
            default:
                console.error('Unsupported template type:', shape);
                return null;
        }

        regionData.shapes = [shape];

        // Create the region document
        const regionDoc = new foundry.documents.RegionDocument(foundry.utils.deepClone(regionData), {
            parent: canvas.scene
        });
        // Create the placeable Region object (ItemTemplate extends Region)
        const region = new this(regionDoc);
        region.item = item;
        region.actorSheet = item.actor?.sheet || null;
        return region;
    }

    /* -------------------------------------------- */

    /**
     * Creates a preview of the spell template.
     * @returns {Promise}  A promise that resolves with the final measured template if created.
     */
    async drawPreview() {
        const regionData = this.document?.toObject();
        // Minimize actor sheet if open
        if (this.actorSheet?.state > 0) {
            this.actorSheet?.minimize();
        }
        // Suppress the Region Legend menu if open (do this before placement)
        if (canvas?.regions?.legend?.close) {
            await canvas.regions.legend.close();
        }
        let placedRegion = null;
        try {
            placedRegion = await canvas.regions.placeRegion(regionData, { create: true });
        } catch (e) {
            return null;
        }
        return placedRegion;
    }
}
