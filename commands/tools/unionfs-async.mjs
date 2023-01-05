import fs from "fs";
import { Union } from "unionfs";
import { createFsFromVolume, Volume } from 'memfs';
function UnionFSPromises() {
    const unionFS = new Union;
    const promises = unionFS.promises;
    promises.use = function (filesystem) {
        unionFS.use({ promises: filesystem });
        return this;
    };
    return promises;
}
export default function TemporaryFsPromises() {
    const promises = UnionFSPromises();
    const vol = new Volume;
    const inMemoryFS = createFsFromVolume(vol);
    return promises
        .use(fs.promises)
        .use(inMemoryFS.promises);
}
//# sourceMappingURL=unionfs-async.mjs.map