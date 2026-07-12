import { Pipe, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { V1Permission } from '../api/models/v1permission';

@Pipe({ name: 'hasPermission' })
export class HasPermissionPipe {
  private readonly route = inject(ActivatedRoute);

  transform(permission: V1Permission): boolean {
    const permissions = this.route.snapshot.data['permissions'] as Record<string, boolean> | undefined;
    return permissions?.[permission] ?? false;
  }
}
