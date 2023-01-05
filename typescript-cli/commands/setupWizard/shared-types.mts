export type PathToFileValidation = (s: string) => true | string;

export type PathWithUncreatedDirs = {
  pathToFile: string;
  uncreatedDirs: string[];
};

/** An individual configuration target. */
export type WritableConfigurationType = {
  "vanilla": {
    "path"?: string;
    "tag": string;
    "vcs": "git" | "hg";
  };

  "integration": {
    "path": string;
    "mozconfig": string;
    "projectDir": string;
  };
};

/** The file structure as a type. */
export type WritableConfigurationJSON = {
  [key: string]: WritableConfigurationType;
  default: WritableConfigurationType;
};
