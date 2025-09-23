declare module 'n8n-workflow' {
  export type ITriggerResponse = {
    closeFunction: () => Promise<void>;
    manualTriggerFunction?: () => Promise<void>;
  };

  export type FunctionsBase = {
    getCredentials<T = any>(name?: string): Promise<T>;
    logger: { info: (msg: string) => void };
  };

  export interface INodePropertyOptions {
    name: string;
    value: any;
  }

  export interface INodeProperties {
    name?: string;
    displayName?: string;
    description?: string;
    type?: string;
    default?: any;
    options?: INodePropertyOptions[];
    required?: boolean;
    [key: string]: any;
  }

  export interface INodeCredentialDescription {
    name: string;
    displayName?: string;
    required?: boolean;
    [key: string]: any;
  }

  export type Icon = string;

  export interface ICredentialType {
    name?: string;
    displayName?: string;
    properties?: INodeProperties[];
  }

  export interface IExecuteFunctions extends FunctionsBase {
    helpers: { returnJsonArray: (data: any) => any };
    getInputData(): INodeExecutionData[];
    getNodeParameter(name: string, itemIndex?: number, fallback?: any): any;
    getNode(): any;
    continueOnFail(): boolean;
  }

  export interface ITriggerFunctions extends FunctionsBase {
    emit(data: any): void;
    helpers: { returnJsonArray: (data: any) => any };
    getMode(): 'trigger' | 'manual';
    getNodeParameter(name: string, itemIndex?: number, fallback?: any): any;
    getNode(): any;
  }

  export interface INodeExecutionData {
    json: any;
    pairedItem?: { item: number };
  }

  export type NodeConnectionType = 'main' | 'input' | 'output' | string;

  export interface INodeTypeDescription {
    displayName: string;
    name: string;
    icon?: Icon;
    group?: string[];
    version?: number;
    description?: string;
    defaults?: { name?: string };
    inputs?: NodeConnectionType[];
    outputs?: NodeConnectionType[];
    credentials?: INodeCredentialDescription[];
    properties?: INodeProperties[];
    [key: string]: any;
  }

  export interface INodeType {
    description: INodeTypeDescription;
  }

  export class NodeOperationError extends Error {
    constructor(node: any, message: string | Error, options?: any);
  }
}
