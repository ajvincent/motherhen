/**
 * Build an element set class for JSON support without a PathResolver.
 * @typeParam Parsed - the parsed object type.
 * @typeParam Serialized - the serialized object type.
 * @param BaseClass - the base class of our dictionary.
 * @returns an ElementSet class.
 */
export function ElementSetBuilder(BaseClass) {
    return class ElementSet extends ElementSetBase {
        static isJSON(value) {
            if (!Array.isArray(value))
                return false;
            return value.every(element => BaseClass.isJSON(element));
        }
        static fromJSON(value) {
            return new this(value.map(element => BaseClass.fromJSON(element)));
        }
    };
}
/**
 * Build an element set class for JSON support with a PathResolver.
 * @typeParam Parsed - the parsed object type.
 * @typeParam Serialized - the serialized object type.
 * @param BaseClass - the base class of our dictionary.
 * @returns an ElementSet class.
 */
export function ElementSetResolverBuilder(BaseClass) {
    return class ElementSet extends ElementSetBase {
        static isJSON(value) {
            if (!Array.isArray(value))
                return false;
            return value.every(element => BaseClass.isJSON(element));
        }
        static fromJSON(pathResolver, value) {
            return new this(value.map(element => BaseClass.fromJSON(pathResolver, element)));
        }
    };
}
/**
 * @typeParam Parsed - the parsed object type.
 * @typeParam Serialized - the serialized object type.
 */
class ElementSetBase extends Set {
    toJSON() {
        return Array.from(this.values()).map(value => value.toJSON());
    }
}
//# sourceMappingURL=ElementSet.js.map