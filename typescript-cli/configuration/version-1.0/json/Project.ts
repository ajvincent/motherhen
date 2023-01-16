import { isJSONObject } from "./JSON_Operations.js";

export type ProjectJSONData = {
  /** the integration dictionary key */
  integrationKey: string;

  /** the mozconfig dictionary key */
  mozconfigKey: string;

  /** a dictionary name under the sources dictionary value to treat as the application directory */
  appDir: string;
}

export default class ProjectJSON implements ProjectJSONData
{
  integrationKey: string;

  mozconfigKey: string;

  appDir: string;

  /**
   * Provide a Project configuration.
   * @param integrationKey - the integration dictionary key
   * @param mozconfigKey - the mozconfig dictionary key
   * @param appDir - a dictionary key under sources to treat as the application directory
   */
  constructor(
    integrationKey: string,
    mozconfigKey: string,
    appDir: string,
  )
  {
    this.integrationKey = integrationKey;
    this.mozconfigKey = mozconfigKey;
    this.appDir = appDir;
  }

  toJSON(): Readonly<ProjectJSONData>
  {
    return {
      integrationKey: this.integrationKey,
      mozconfigKey: this.mozconfigKey,
      appDir: this.appDir,
    };
  }

  static isJSON(
    unknownValue: unknown
  ) : unknownValue is ProjectJSONData
  {
    if (!isJSONObject(unknownValue))
      return false;

    const value = unknownValue as ProjectJSONData;
    return (
      (typeof value.integrationKey === "string") &&
      (typeof value.mozconfigKey === "string") &&
      (typeof value.appDir === "string")
    );
  }

  static fromJSON(
    value: ProjectJSONData
  ) : ProjectJSON
  {
    return new ProjectJSON(
      value.integrationKey,
      value.mozconfigKey,
      value.appDir,
    );
  }
}
