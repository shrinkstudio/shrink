/**
 * A render controller for an element.
 * It allows to render and remove the element from the DOM.
 */
export class Renderer {
  #rendered = true;
  #anchor = new Comment();

  /**
   * Creates a render controller instance for an element.
   * @param element The element to control.
   */
  constructor(public readonly element: Element) {}

  /**
   * Renders the element using the anchor as a reference.
   */
  render() {
    if (this.#rendered) return;

    this.#anchor.after(this.element);
    this.#anchor.remove();

    this.#rendered = true;
  }

  /**
   * Removes the element from the DOM and replaces it with the anchor.
   */
  remove() {
    if (!this.#rendered) return;

    this.element.after(this.#anchor);
    this.element.remove();

    this.#rendered = false;
  }

  /**
   * Updates the element's rendering state.
   * @param shouldRender Whether the element should be rendered or not.
   */
  update(shouldRender: boolean) {
    if (shouldRender) this.render();
    else this.remove();
  }

  /**
   * Destroys the render controller.
   * @param forceRender Whether to force the element to be rendered after destroying the controller.
   */
  destroy = (forceRender = true) => {
    if (forceRender) {
      this.render();
    }

    this.#anchor.remove();
  };
}
