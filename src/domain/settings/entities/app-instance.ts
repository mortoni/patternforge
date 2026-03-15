/**
 * AppInstance entity: single installation / browser context.
 */

export interface AppInstance {
  installationId: string;
  createdAt: string;
  lastOpenedAt: string;
}
