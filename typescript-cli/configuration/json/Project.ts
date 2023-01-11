import { isJSONObject } from "./JSON_Operations";

export type ProjectJSONData = {
  integrationKey: string;
  mozconfigKey: string;
  appDirKey: string;
}

export default class ProjectJSON implements ProjectJSONData
{
  /** the integration dictionary key */
  integrationKey: string;

  /** the mozconfig dictionary key */
  mozconfigKey: string;

  /** a dictionary key under sources to treat as the application directory */
  appDirKey: string;

  /**
   * Provide a Project configuration.
   * @param integrationKey - the integration dictionary key
   * @param mozconfigKey - the mozconfig dictionary key
   * @param appDirKey - a dictionary key under sources to treat as the application directory
   */
  constructor(
    integrationKey: string,
    mozconfigKey: string,
    appDirKey: string,
  )
  {
    this.integrationKey = integrationKey;
    this.mozconfigKey = mozconfigKey;
    this.appDirKey = appDirKey;
  }

  toJSON(): Readonly<ProjectJSONData>
  {
    return {
      integrationKey: this.integrationKey,
      mozconfigKey: this.mozconfigKey,
      appDirKey: this.appDirKey,
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
      (typeof value.appDirKey === "string")
    );
  }

  static fromJSON(
    value: ProjectJSONData
  ) : ProjectJSON
  {
    return new ProjectJSON(
      value.integrationKey,
      value.mozconfigKey,
      value.appDirKey,
    );
  }
}
