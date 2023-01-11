import { isJSONObject, } from "./JSON_Operations";
// #region Dictionaries without PathResolver
/**
 * Build a dictionary class for JSON support.
 *
 * @typeParam Parsed - the parsed object type.
 * @typeParam Serialized - the serialized object type.
 * @param BaseClass - the base class of our dictionary.
 * @returns a Dictionary class.
 */
export function DictionaryBuilder(BaseClass) {
    return class Dictionary extends DictionaryMap {
        static isJSON(value) {
            return isJSONDictionary(value, element => BaseClass.isJSON(element));
        }
        static fromJSON(value) {
            return new this(entriesFromDictionary(value, BaseClass));
        }
    };
}
/**
 * @typeParam Parsed - the parsed object type.
 * @typeParam Serialized - the serialized object type.
 * @param value - a dictionary of serialized members.
 * @param elementBase - the base class.
 * @returns a list of dictionary entries for the parsed dictionary to build.
 */
function entriesFromDictionary(value, elementBase) {
    return Object.entries(value).map(([key, value]) => [key, elementBase.fromJSON(value)]);
}
// #endregion Dictionaries without PathResolver
// #region Dictionaries with PathResolver
/**
 * Build a dictionary class for JSON support.
 *
 * @typeParam Parsed - the parsed object type.
 * @typeParam Serialized - the serialized object type.
 * @param BaseClass - the base class of our dictionary.
 * @returns a Dictionary class.
 */
export function DictionaryResolverBuilder(BaseClass) {
    return class Dictionary extends DictionaryMap {
        static isJSON(value) {
            return isJSONDictionary(value, element => BaseClass.isJSON(element));
        }
        static fromJSON(pathResolver, value) {
            return new this(entriesFromDictionaryResolver(value, pathResolver, BaseClass));
        }
    };
}
/**
 * @typeParam Parsed - the parsed object type.
 * @typeParam Serialized - the serialized object type.
 * @param value - a dictionary of serialized members.
 * @param pathResolver - the path resolver to pass in to the base class.
 * @param elementBase - the base class.
 * @returns a list of dictionary entries for the parsed dictionary to build.
 */
function entriesFromDictionaryResolver(value, pathResolver, elementBase) {
    return Object.entries(value).map(([key, value]) => [key, elementBase.fromJSON(pathResolver, value)]);
}
/**
 * @typeParam Parsed - the parsed object type.
 * @typeParam Serialized - the serialized object type.
 */
export class DictionaryMap extends Map {
    toJSON() {
        const result = {};
        this.forEach((parsedValue, key) => result[key] = parsedValue.toJSON());
        return result;
    }
}
/**
 * @typeParam Serialized - the serialized object type.
 * @param unknownValue - the value to check.
 * @param elementChecker - a callback to establish member types.
 * @returns true if we have a JSON dictionary of Serialized values.
 */
function isJSONDictionary(unknownValue, elementChecker) {
    if (!isJSONObject(unknownValue))
        return false;
    const entries = Object.entries(unknownValue);
    return entries.every(([key, property]) => isElement(key, property, elementChecker));
}
/**
 * @param key - the potential key
 * @param property - the potential property
 * @param elementChecker - a callback to establish if the property matches the type.
 * @returns true if we have an element of a dictionary.
 */
function isElement(key, property, elementChecker) {
    return (typeof key === "string") && elementChecker(property);
}
// #endregion shared code
//# sourceMappingURL=Dictionary.js.map