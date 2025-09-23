declare module 'n8n-workflow' {
  export type ITriggerResponse = {
    closeFunction: () => Promise<void>;
    manualTriggerFunction?: () => Promise<void>;
  };

  export type FunctionsBase = {
    getCredentials<T = any>(name: string): Promise<T>;
    logger: { info: (msg: string) => void };
  };

  export interface IExecuteFunctions extends FunctionsBase {
    helpers: { returnJsonArray: (data: any) => any };
  }

  export interface ITriggerFunctions extends FunctionsBase {
    emit(data: any): void;
    helpers: { returnJsonArray: (data: any) => any };
    getMode(): 'trigger' | 'manual';
  }
}

