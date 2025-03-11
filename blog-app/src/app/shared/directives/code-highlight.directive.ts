import { AfterViewInit, Directive, ElementRef, Input, OnChanges, SimpleChanges, Renderer2 } from '@angular/core';

// This directive uses PrismJS for code syntax highlighting
// Make sure PrismJS is added to your project via npm and configured in angular.json
declare var Prism: any;

@Directive({
  selector: '[appCodeHighlight]',
  standalone: true
})
export class CodeHighlightDirective implements AfterViewInit, OnChanges {
  @Input() appCodeHighlight: string = ''; // Code language
  @Input() code: string = ''; // Code content
  
  constructor(private el: ElementRef, private renderer: Renderer2) {}
  
  ngAfterViewInit() {
    this.highlightCode();
  }
  
  ngOnChanges(changes: SimpleChanges) {
    if (changes['code'] || changes['appCodeHighlight']) {
      // Wait for the next tick to make sure DOM is updated
      setTimeout(() => {
        this.highlightCode();
      }, 0);
    }
  }
  
  private highlightCode() {
    // If code is not provided via input, use the element's content
    const codeToHighlight = this.code || this.el.nativeElement.textContent || '';
    
    // If there's no code to highlight, do nothing
    if (!codeToHighlight.trim()) {
      return;
    }
    
    // Get language from input or default to 'typescript'
    const language = this.appCodeHighlight || 'typescript';
    
    // Set language class and data attribute on the element
    this.renderer.addClass(this.el.nativeElement, `language-${language}`);
    this.renderer.setAttribute(this.el.nativeElement, 'data-language', language);
    
    // Clear the element and set the code content
    this.el.nativeElement.textContent = codeToHighlight;
    
    // Apply Prism highlighting if available
    if (typeof Prism !== 'undefined') {
      Prism.highlightElement(this.el.nativeElement);
    } else {
      console.warn('Prism library not loaded. Code highlighting will not work.');
      
      // Fallback: Create a basic code element for styling
      const codeElement = this.renderer.createElement('code');
      this.renderer.addClass(codeElement, `language-${language}`);
      this.renderer.appendChild(codeElement, this.renderer.createText(codeToHighlight));
      
      // Clear the host element and append the code element
      while (this.el.nativeElement.firstChild) {
        this.renderer.removeChild(this.el.nativeElement, this.el.nativeElement.firstChild);
      }
      this.renderer.appendChild(this.el.nativeElement, codeElement);
    }
  }
}