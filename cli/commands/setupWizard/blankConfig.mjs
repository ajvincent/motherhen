/** Craft a completely blank project configuration.  Other modules fill in the gaps. */
export default function buildBlank() {
    return {
        vanilla: {
            tag: "",
        },
        integration: {
            path: "",
            mozconfig: "",
        }
    };
}
//# sourceMappingURL=blankConfig.mjs.map