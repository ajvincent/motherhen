import fs from "fs";
import { Union } from "unionfs";
import { createFsFromVolume, Volume } from 'memfs';
import { IFS } from "unionfs/lib/fs";

type FS_Promises = (typeof fs)["promises"];

type UseFSPromises = FS_Promises & {
  use(filesystem: FS_Promises): UseFSPromises
};

function UnionFSPromises() : UseFSPromises
{
  const unionFS = new Union;
  const promises = unionFS.promises as UseFSPromises;
  promises.use = function(filesystem: FS_Promises) : UseFSPromises {
    unionFS.use({ promises: filesystem } as IFS);
    return this;
  }

  return promises;
}

export default function TemporaryFsPromises() : (typeof fs)["promises"]
{
  const promises = UnionFSPromises();

  const vol = new Volume;
  const inMemoryFS = createFsFromVolume(vol);

  return promises
    .use(fs.promises)
    .use(inMemoryFS.promises as unknown as FS_Promises);
}
