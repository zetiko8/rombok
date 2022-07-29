export enum ERROR_STRATEGY {
  terminate = 'terminate',
  non_terminating = 'non_terminating',
}

export enum ERROR {
  loadPipeError,
  triggerError,
  unknown,
}

export class LoadableRxError extends Error {
  isLoadableRxError = true;
  type: ERROR = ERROR.unknown;
  originalError: Error;
  constructor(
    message: string | Error | LoadableRxError | unknown,
    options: { type?: ERROR } = {},
  ) {
    super('');
    if (message instanceof LoadableRxError || message instanceof Error) {
      this.message = message.message;
      this.stack = message.stack;
      if (message instanceof LoadableRxError) {
        this.originalError = message.originalError;
        this.type = message.type;
      } else {
        this.originalError = message;
      }
    } else {
      this.message = typeof message === 'string' ? message : 'Unknown';
      this.originalError = new Error();
      this.originalError.stack = this.stack;
      this.originalError.message = this.message;
    } 

    if (options.type !== undefined) {
      this.type = options.type;
    }
  }
}
