import { isJSONObject } from "./JSON_Operations.js";

export type ProjectJSONData = {
  /** the integration dictionary key */
  integrationKey: string;

  /** the mozconfig to find in `${projectRoot}/mozconfigs/base` */
  mozconfig: string;

  /** a dictionary name under the sources dictionary value to treat as the application directory */
  appDir: string;

  /** The application name to display to the end-user, which we store as MOZ_APP_DISPLAYNAME .*/
  displayAppName: string;
}

export default class ProjectJSON implements ProjectJSONData
{
  integrationKey: string;
  mozconfig: string;
  appDir: string;
  displayAppName: string;

  /**
   * Provide a Project configuration.
   * @param integrationKey - the integration dictionary key
   * @param mozconfig - the mozconfig to find in `${projectRoot}/mozconfigs/base`
   * @param appDir - a dictionary key under sources to treat as the application directory
   * @param displayAppName - The application name to display to the end-user, which we store as MOZ_APP_DISPLAYNAME
   */
  constructor(
    integrationKey: string,
    mozconfig: string,
    appDir: string,
    displayAppName: string,
  )
  {
    this.integrationKey = integrationKey;
    this.mozconfig = mozconfig;
    this.appDir = appDir;
    this.displayAppName = displayAppName;
  }

  toJSON(): Readonly<ProjectJSONData>
  {
    return {
      integrationKey: this.integrationKey,
      mozconfig: this.mozconfig,
      appDir: this.appDir,
      displayAppName: this.displayAppName,
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
      (typeof value.mozconfig === "string") &&
      (typeof value.appDir === "string") &&
      (typeof value.displayAppName === "string")
    );
  }

  static fromJSON(
    value: ProjectJSONData
  ) : ProjectJSON
  {
    return new ProjectJSON(
      value.integrationKey,
      value.mozconfig,
      value.appDir,
      value.displayAppName,
    );
  }
}
