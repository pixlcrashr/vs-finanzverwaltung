import { Injectable, inject, signal, WritableSignal, effect } from '@angular/core';
import { Observable, map, shareReplay, take } from 'rxjs';
import { Permission, allPermissions } from './permissions';

export abstract class AuthorizationDataService {
  abstract checkPermissions(
    user: string,
    domain: string,
    permissions: Permission[],
  ): Observable<Record<string, boolean>>;

  abstract batchCheckPermissions(
    requests: { user: string; domain: string; permissions: Permission[] }[],
  ): Observable<Record<string, Record<string, boolean>>>;
}

const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  observable: Observable<Set<Permission>>;
  createdAt: number;
}

@Injectable({ providedIn: 'root' })
export class AuthorizationService {
  private readonly dataService = inject(AuthorizationDataService);

  readonly currentUser: WritableSignal<string | null> = signal(null);

  private readonly permissionCache = new Map<string, CacheEntry>();

  constructor() {
    effect(() => {
      this.currentUser();
      this.permissionCache.clear();
    });
  }

  checkPermissions(
    user: string,
    domain: string,
    permissions: Permission[],
  ): Observable<Record<string, boolean>> {
    return this.getAllHeldPermissions(user, domain).pipe(
      map((held) => {
        const result: Record<string, boolean> = {};
        for (const p of permissions) {
          result[p] = held.has(p);
        }
        return result;
      }),
      take(1),
    );
  }

  hasPermission(
    user: string,
    domain: string,
    permission: Permission,
  ): Observable<boolean> {
    return this.getAllHeldPermissions(user, domain).pipe(
      map((held) => held.has(permission)),
      take(1),
    );
  }

  batchCheckPermissions(
    requests: { user: string; domain: string; permissions: Permission[] }[],
  ): Observable<Record<string, Record<string, boolean>>> {
    return this.dataService.batchCheckPermissions(requests).pipe(
      map((results) => {
        const out: Record<string, Record<string, boolean>> = {};
        for (const [user, perms] of Object.entries(results)) {
          out[user] = perms;
        }
        return out;
      }),
      take(1),
    );
  }

  private getAllHeldPermissions(user: string, domain: string): Observable<Set<Permission>> {
    const cacheKey = domain ? `domain:${domain}` : 'global';
    const now = Date.now();
    const existing = this.permissionCache.get(cacheKey);

    if (existing && now - existing.createdAt < CACHE_TTL_MS) {
      return existing.observable;
    }

    this.permissionCache.delete(cacheKey);

    const observable$ = this.dataService.checkPermissions(user, domain, allPermissions).pipe(
      map((result) => {
        const held = new Set<Permission>();
        for (const [perm, granted] of Object.entries(result)) {
          if (granted) {
            held.add(perm as Permission);
          }
        }
        return held;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.permissionCache.set(cacheKey, { observable: observable$, createdAt: now });
    return observable$;
  }
}
