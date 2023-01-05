/** Craft a completely blank project configuration.  Other modules fill in the gaps. */
export default function buildBlank() {
    return {
        vanilla: {
            tag: "",
            vcs: "hg",
        },
        integration: {
            path: "",
            mozconfig: "",
            projectDir: "",
        }
    };
}
//# sourceMappingURL=blankConfig.mjs.map