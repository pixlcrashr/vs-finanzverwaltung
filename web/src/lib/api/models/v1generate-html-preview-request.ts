/* tslint:disable */

/**
 * Request message for generating an HTML preview from a raw template.
 * This is a custom method (AIP-136) independent of any single reportTemplate resource.
 */
export interface V1GenerateHtmlPreviewRequest {

  /**
   * The raw Go html/template source to render.
   */
  template: string;
}
