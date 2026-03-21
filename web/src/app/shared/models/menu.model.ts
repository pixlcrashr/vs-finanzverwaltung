export interface MenuItem {
  name: string;
  path: string;
  icon?: string;
  excludePaths?: string[];
}

export interface MenuConfig {
  mainItems: MenuItem[];
  adminItems: MenuItem[];
}
