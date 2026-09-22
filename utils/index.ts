export const isEmpty = (text: string | null) => {
  return text === null || text?.trim() === "";
};
