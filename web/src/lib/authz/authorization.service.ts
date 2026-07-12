import { Injectable, inject, signal, WritableSignal, effect } from '@angular/core';
import { Observable, map, shareReplay, take } from 'rxjs';
import { V1Permission } from '../api/models/v1permission';

export abstract class AuthorizationDataService {
  abstract checkPermissions(
    user: string,
    organization: string,
    permissions: V1Permission[],
  ): Observable<Record<string, boolean>>;

  abstract checkGlobalPermissions(
    user: string,
    permissions: V1Permission[],
  ): Observable<Record<string, boolean>>;

  abstract batchCheckGlobalPermissions(
    requests: { user: string; permissions: V1Permission[] }[],
  ): Observable<Record<string, Record<string, boolean>>>;
}

const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  observable: Observable<Set<V1Permission>>;
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
    organization: string,
    permissions: V1Permission[],
  ): Observable<Record<string, boolean>> {
    return this.getAllHeldPermissions(user, organization).pipe(
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

  checkGlobalPermissions(
    user: string,
    permissions: V1Permission[],
  ): Observable<Record<string, boolean>> {
    return this.getAllHeldGlobalPermissions(user).pipe(
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
    organization: string,
    permission: V1Permission,
  ): Observable<boolean> {
    return this.getAllHeldPermissions(user, organization).pipe(
      map((held) => held.has(permission)),
      take(1),
    );
  }

  hasGlobalPermission(
    user: string,
    permission: V1Permission,
  ): Observable<boolean> {
    return this.getAllHeldGlobalPermissions(user).pipe(
      map((held) => held.has(permission)),
      take(1),
    );
  }

  batchCheckGlobalPermissions(
    requests: { user: string; permissions: V1Permission[] }[],
  ): Observable<Record<string, Record<string, boolean>>> {
    return this.dataService.batchCheckGlobalPermissions(requests).pipe(
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

  private getAllHeldPermissions(user: string, organization: string): Observable<Set<V1Permission>> {
    const cacheKey = `org:${organization}`;
    const now = Date.now();
    const existing = this.permissionCache.get(cacheKey);

    if (existing && now - existing.createdAt < CACHE_TTL_MS) {
      return existing.observable;
    }

    this.permissionCache.delete(cacheKey);

    const allPermissions = V1Permission.values().filter((p) => p !== 'PERMISSION_UNSPECIFIED');
    const observable$ = this.dataService.checkPermissions(user, organization, allPermissions).pipe(
      map((result) => {
        const held = new Set<V1Permission>();
        for (const [perm, granted] of Object.entries(result)) {
          if (granted) {
            held.add(perm as V1Permission);
          }
        }
        return held;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.permissionCache.set(cacheKey, { observable: observable$, createdAt: now });
    return observable$;
  }

  private getAllHeldGlobalPermissions(user: string): Observable<Set<V1Permission>> {
    const cacheKey = 'global';
    const now = Date.now();
    const existing = this.permissionCache.get(cacheKey);

    if (existing && now - existing.createdAt < CACHE_TTL_MS) {
      return existing.observable;
    }

    this.permissionCache.delete(cacheKey);

    const allPermissions = V1Permission.values().filter((p) => p !== 'PERMISSION_UNSPECIFIED');
    const observable$ = this.dataService.checkGlobalPermissions(user, allPermissions).pipe(
      map((result) => {
        const held = new Set<V1Permission>();
        for (const [perm, granted] of Object.entries(result)) {
          if (granted) {
            held.add(perm as V1Permission);
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
