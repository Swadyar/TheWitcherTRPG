export class DamageInstance {
    constructor(damage) {
        this.initialDamage = damage;
        this.damage = damage;
        this.type = null;
        this.shielded = null;
        this.blocked = null;
        this.afterSp = null;
        this.afterLocation = null;
        this.afterResistance = null;
        this.source = null;
    }

    static create(damage) {
        return new DamageInstance(damage);
    }

    setType(type) {
        this.type = type;
        return this;
    }

    setShielded(shielded) {
        this.shielded = shielded;
        return this;
    }

    setSource(source) {
        this.source = source;
        return this;
    }

    initialDamageText() {
        return '' + this.initialDamage + (this.source ? '[' + this.source + ']' : '');
    }

    afterSpText() {
        return '' + this.afterSp + (this.source ? '[' + this.source + ']' : '');
    }

    afterLocationText() {
        return '' + this.afterLocation + (this.source ? '[' + this.source + ']' : '');
    }

    afterResistanceText() {
        return '' + this.afterResistance + (this.source ? '[' + this.source + ']' : '');
    }

    damageText() {
        return '' + this.damage + (this.source ? '[' + this.source + ']' : '');
    }
}
