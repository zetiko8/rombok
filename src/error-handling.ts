export enum ERROR_STRATEGY {
  terminate = 'terminate',
  non_terminating = 'non_terminating',
}

export class TriggerError extends Error {
  isTriggerError = true;
  originalError: Error;
  constructor(error: Error) {
    super(error.message);
    this.stack = error.stack;
    this.originalError = error;
  }
}
