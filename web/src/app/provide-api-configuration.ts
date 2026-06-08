import { Provider } from '@angular/core';
import { ApiConfiguration } from '../lib/api/api-configuration';

export function provideApiConfiguration(rootUrl: string): Provider {
  return {
    provide: ApiConfiguration,
    useFactory: () => {
      const cfg = new ApiConfiguration();
      cfg.rootUrl = rootUrl;
      return cfg;
    },
  };
}
