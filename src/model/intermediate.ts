/**
 * JSON Schema type definition
 */
export interface JSONSchema {
  type?: string | string[];
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema;
  required?: string[];
  enum?: unknown[];
  description?: string;
  default?: unknown;
  format?: string;
  $ref?: string;
  oneOf?: JSONSchema[];
  anyOf?: JSONSchema[];
  allOf?: JSONSchema[];
  [key: string]: unknown;
}

/**
 * Property model - represents a component input/prop
 */
export interface PropModel {
  name: string;
  attribute?: string;
  schema: JSONSchema;
  required: boolean;
  source: 'input' | 'attribute';
}

/**
 * Event model - represents a component output/event
 */
export interface EventModel {
  name: string;
  type: 'CustomEvent' | 'EventEmitter';
  payloadSchema?: JSONSchema;
  source: 'dispatchEvent' | 'output';
}

/**
 * Web Component model - represents a single web component
 */
export interface WebComponentModel {
  tagName: string;
  className: string;
  modulePath: string;
  props: PropModel[];
  events: EventModel[];
}

/**
 * Runtime model - describes the build/runtime configuration
 */
export interface RuntimeModel {
  bundler: 'webpack' | 'vite';
  federation?: {
    remoteName: string;
    libraryType?: string;
    exposes?: Record<string, string>;
  };
}

/**
 * Intermediate Component Model - the unified representation
 * that adapters produce and the schema builder consumes
 */
export interface IntermediateModel {
  runtime: RuntimeModel;
  components: WebComponentModel[];
}

/**
 * OWCS Specification - the final output format
 */
export interface OWCSSpec {
  owcs: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  runtime?: {
    bundler: {
      name: string;
      moduleFederation?: {
        remoteName: string;
        libraryType?: string;
        exposes?: Record<string, string>;
      };
    };
  };
  components: {
    webComponents: Record<string, OWCSComponent>;
  };
}

/**
 * Individual component in OWCS spec
 */
export interface OWCSComponent {
  tagName: string;
  module?: string;
  props?: {
    schema: JSONSchema;
  };
  events?: Record<string, OWCSEvent>;
}

/**
 * Event definition in OWCS spec
 */
export interface OWCSEvent {
  type: string;
  payload?: JSONSchema;
}
