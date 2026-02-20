import { IntermediateModel, OWCSSpec, OWCSComponent, JSONSchema, WebComponentModel, PropModel, BuildOptions } from '../model/intermediate.js';

/**
 * Builds OWCS specification from IntermediateModel
 */
export class SchemaBuilder {
  /**
   * Converts IntermediateModel to OWCSSpec
   */
  public build(model: IntermediateModel, options?: BuildOptions): OWCSSpec {
    const spec: OWCSSpec = {
      owcs: '1.0.0',
      info: {
        title: options?.title || this.inferTitle(model),
        version: options?.version || '1.0.0',
        description: options?.description,
      },
      components: {
        webComponents: {},
      },
    };

    // Add custom extensions first
    if (options?.extensions) {
      this.validateExtensions(options.extensions);
      for (const [key, value] of Object.entries(options.extensions)) {
        spec[key] = value;
      }
    }

    // Add x-owcs-runtime extension if includeRuntimeExtension is true
    // This comes after custom extensions so runtime extension takes precedence
    if (options?.includeRuntimeExtension && model.runtime.bundler) {
      spec['x-owcs-runtime'] = {
        bundler: {
          name: model.runtime.bundler,
        },
      };

      if (model.runtime.federation) {
        spec['x-owcs-runtime'].bundler.moduleFederation = {
          remoteName: model.runtime.federation.remoteName,
          libraryType: model.runtime.federation.libraryType,
          exposes: model.runtime.federation.exposes,
        };
      }
    }

    // Add components
    for (const component of model.components) {
      const owcsComponent = this.buildComponent(component);
      spec.components.webComponents[component.tagName] = owcsComponent;
    }

    return spec;
  }

  /**
   * Validates that all extension keys start with 'x-'
   */
  private validateExtensions(extensions: Record<string, unknown>): void {
    const invalidKeys = Object.keys(extensions).filter((key) => !key.startsWith('x-'));

    if (invalidKeys.length > 0) {
      throw new Error(`Invalid extension keys: ${invalidKeys.join(', ')}. All extension keys must start with 'x-'`);
    }
  }

  /**
   * Builds OWCS component from WebComponentModel
   */
  private buildComponent(component: WebComponentModel): OWCSComponent {
    const owcsComponent: OWCSComponent = {
      tagName: component.tagName,
      className: component.className,
    };

    // Add props schema
    if (component.props && component.props.length > 0) {
      owcsComponent.props = {
        schema: this.buildPropsSchema(component.props),
      };
    }

    // Add events
    if (component.events && component.events.length > 0) {
      owcsComponent.events = {};

      for (const event of component.events) {
        owcsComponent.events[event.name] = {
          type: event.type,
          payload: event.payloadSchema,
        };
      }
    }

    return owcsComponent;
  }

  /**
   * Builds JSON Schema for props
   */
  private buildPropsSchema(props: PropModel[]): JSONSchema {
    const properties: Record<string, JSONSchema> = {};
    const required: string[] = [];

    for (const prop of props) {
      properties[prop.name] = {
        ...prop.schema,
        description: prop.schema.description,
      };

      if (prop.required) {
        required.push(prop.name);
      }
    }

    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }

  /**
   * Infers title from model
   */
  private inferTitle(model: IntermediateModel): string {
    if (model.runtime.federation?.remoteName) {
      return model.runtime.federation.remoteName;
    }

    if (model.components.length > 0) {
      return `${model.components[0].className} Components`;
    }

    return 'Web Components';
  }
}

/**
 * Convenience function to build OWCS spec
 */
export function buildOWCSSpec(model: IntermediateModel, options?: BuildOptions): OWCSSpec {
  const builder = new SchemaBuilder();
  return builder.build(model, options);
}
