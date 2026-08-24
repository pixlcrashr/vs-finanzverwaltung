import { Organization } from '../models';

export function getMostRecentOrganization(orgs: Organization[]): Organization | undefined {
  if (orgs.length === 0) {
    return undefined;
  }

  return [...orgs].sort((a, b) => {
    const time = (o: Organization) => new Date(o.updateTime ?? o.createTime ?? 0).getTime();
    return time(b) - time(a);
  })[0];
}
