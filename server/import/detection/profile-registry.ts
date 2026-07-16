import type { FileProfile } from './file-profile';

export class ProfileRegistry {
  private readonly profiles: FileProfile[] = [];

  public register(profile: FileProfile): void {
    this.profiles.push(profile);
  }

  public getProfiles(): readonly FileProfile[] {
    return this.profiles;
  }

  public clear(): void {
    this.profiles.length = 0;
  }
}
