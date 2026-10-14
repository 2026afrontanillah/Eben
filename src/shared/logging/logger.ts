export const logger = {
  error(context: string, error: unknown): void {
    console.error(`[${context}]`, error);
  },
};
