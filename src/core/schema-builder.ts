import { IntermediateModel, OWCSSpec, OWCSComponent, JSONSchema } from '../model/intermediate';

/**
 * Builds OWCS specification from IntermediateModel
 */
export class SchemaBuilder {
  /**
   * Converts IntermediateModel to OWCSSpec
   */
  public build(model: IntermediateModel, info?: { title?: string; version?: string; description?: string }): OWCSSpec {
    const spec: OWCSSpec = {
      owcs: '1.0.0',
      info: {
        title: info?.title || this.inferTitle(model),
        version: info?.version || '1.0.0',
        description: info?.description,
      },
      components: {
        webComponents: {},
      },
    };
    
    // Add runtime configuration if present
    if (model.runtime.bundler) {
      spec.runtime = {
        bundler: {
          name: model.runtime.bundler,
        },
      };
      
      if (model.runtime.federation) {
        spec.runtime.bundler.moduleFederation = {
          remoteName: model.runtime.federation.remoteName,
          libraryType: model.runtime.federation.libraryType,
          exposes: model.runtime.federation.exposes,
        };
      }
    }
    
    // Add components
    for (const component of model.components) {
      const owcsComponent = this.buildComponent(component, model.runtime.federation?.exposes);
      spec.components.webComponents[component.tagName] = owcsComponent;
    }
    
    return spec;
  }
  
  /**
   * Builds OWCS component from WebComponentModel
   */
  private buildComponent(component: any, exposes?: Record<string, string>): OWCSComponent {
    const owcsComponent: OWCSComponent = {
      tagName: component.tagName,
    };
    
    // Find exposed module path
    if (exposes) {
      for (const [exposeName, exposePath] of Object.entries(exposes)) {
        if (exposePath.includes(component.modulePath) || exposePath.includes(component.className)) {
          owcsComponent.module = exposeName;
          break;
        }
      }
    }
    
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
  private buildPropsSchema(props: any[]): JSONSchema {
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
export function buildOWCSSpec(
  model: IntermediateModel,
  info?: { title?: string; version?: string; description?: string }
): OWCSSpec {
  const builder = new SchemaBuilder();
  return builder.build(model, info);
}
