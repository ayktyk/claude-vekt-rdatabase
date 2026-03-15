export const formatDateTr = (date: string) =>
  new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(date));

