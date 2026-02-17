export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const formatDate = (value: string) => {
  const date = new Date(value);
  return date.toLocaleDateString('pt-BR');
};

export const formatMonthYear = (value: Date) =>
  value.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

export const isSameMonthYear = (value: string, reference: Date) => {
  const date = new Date(value);
  return date.getMonth() === reference.getMonth() && date.getFullYear() === reference.getFullYear();
};

export const addMonths = (value: Date, amount: number) => {
  const next = new Date(value);
  next.setMonth(next.getMonth() + amount);
  return next;
};
