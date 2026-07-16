export let spellRegionMixin = {
    async createSpellRegion(roll, damage, options) {
        if (
            this.templateProperties.createTemplate &&
            this.templateProperties.templateType &&
            this.templateProperties.templateSize
        ) {
            this.fromItem(this.parent, { roll, damage, options })
                .then(async regions => {
                    await this.regionProperties.addBehaviorsToRegions(regions);

                    return regions;
                })
                .then(regions => this.deleteSpellVisualEffect(regions))
                .catch(() => {});
        }
    },

    /**
     * @param {Item} item               The Item object for which to construct the region
     * @returns {RegionDocument}    The created region document
     */
    async fromItem(item, { roll, damage, flagOptions = {} }) {
        const shapeType = item.system.templateProperties.templateType;
        if (!shapeType) return null;

        const grid = canvas.scene?.grid;

        const regionData = {
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
            flags: {
                TheWitcherTRPG: {
                    roll: roll,
                    item: item,
                    itemUuid: item.uuid,
                    duration: damage?.duration,
                    actorUuid: item.parent.uuid,
                    options: flagOptions
                }
            }
        };

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
            case 'emanation':
                shape = { type: 'circle', x, y, radius: templateSize, gridBased };
                break;
            default:
                console.error('Unsupported template type:', shape);
                return null;
        }

        regionData.shapes = [shape];

        let regions = [];
        if (shapeType === 'emanation') {
            regions = await Promise.all(
                item.actor
                    .getDependentTokens()
                    .filter(token => token.scene !== game.user.viewedScene)
                    .map(async token =>
                        foundry.documents.RegionDocument.createTokenEmanation(
                            token,
                            item.system.templateProperties.templateSize / 2 / grid.distance,
                            regionData
                        )
                    )
            );
        } else {
            regions.push(await Promise.all(this.drawPreview(regionData)));
        }
        regions.forEach(region => {
            region.item = item;
            region.actorSheet = item.actor?.sheet || null;
        });

        return regions;
    },

    async drawPreview(regionData) {
        // Minimize apps if open
        foundry.applications.instances.forEach((app, key) => app.minimize());

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
    },

    async deleteSpellVisualEffect(regions) {
        if (!game.user.isGM) {
            game.users.activeGM.query('TheWitcherTRPG.query', {
                function: 'deleteSpellVisualEffect',
                uuid: item.uuid,
                data: [regions.map(template => template.uuid)]
            });
        }

        if (regions && this.templateProperties.visualEffectDuration > 0) {
            regions.forEach(region => {
                setTimeout(() => {
                    canvas.scene.deleteEmbeddedDocuments('Region', [region.id]);
                }, this.templateProperties.visualEffectDuration * 1000);
            });
        }
    }
};
