export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const parseLocalDate = (value: string) => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  return new Date(value);
};

export const formatDate = (value: string) => {
  const date = parseLocalDate(value);
  return date.toLocaleDateString('pt-BR');
};

export const formatMonthYear = (value: Date) =>
  value.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

export const isSameMonthYear = (value: string, reference: Date) => {
  const date = parseLocalDate(value);
  return date.getMonth() === reference.getMonth() && date.getFullYear() === reference.getFullYear();
};

export const addMonths = (value: Date, amount: number) => {
  const next = new Date(value);
  next.setMonth(next.getMonth() + amount);
  return next;
};
