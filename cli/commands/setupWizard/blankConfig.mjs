/** Craft a completely blank project configuration.  Other modules fill in the gaps. */
export default function buildBlank() {
    return {
        vanilla: {
            tag: "",
        },
        integration: {
            path: "",
            mozconfig: "",
            projectDir: "",
        }
    };
}
//# sourceMappingURL=blankConfig.mjs.map