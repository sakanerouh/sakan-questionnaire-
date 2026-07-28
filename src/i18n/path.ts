export const preservePathAndSearch = (pathname: string, search: string) =>
  `${pathname}${search ? `?${search}` : ""}`;
