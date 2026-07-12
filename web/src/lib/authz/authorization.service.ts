import { Injectable, inject, signal, WritableSignal, effect } from '@angular/core';
import { Observable, map, shareReplay, take } from 'rxjs';
import { V1Permission } from '../api/models/v1permission';

export abstract class AuthorizationDataService {
  abstract checkPermissions(
    user: string,
    organization: string,
    permissions: V1Permission[],
  ): Observable<Record<string, boolean>>;
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

  private getAllHeldPermissions(user: string, organization: string): Observable<Set<V1Permission>> {
    const now = Date.now();
    const existing = this.permissionCache.get(organization);

    if (existing && now - existing.createdAt < CACHE_TTL_MS) {
      return existing.observable;
    }

    this.permissionCache.delete(organization);

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

    this.permissionCache.set(organization, { observable: observable$, createdAt: now });
    return observable$;
  }
}
