
export function formatUuid(id: string, format?: 'short' | 'separatorless'): string {
  switch (format) {
    case 'short':
      return id.slice(0, 8);

    case 'separatorless':
      return id.replace(/-/g, '');

    default:
      return id;
  }
}

export function formatDateShort(d: Date): string {
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
}

export function formatDateInputField(d: Date): string {
  return d.toISOString().split('T')[0];
}
