// src/app/shared/directives/infinite-scroll.directive.ts
import { Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';

@Directive({
  selector: '[appInfiniteScroll]',
  standalone: true
})
export class InfiniteScrollDirective implements OnInit, OnDestroy {
  @Input() scrollThreshold = 100; // Default threshold distance from bottom to trigger load
  @Output() scrolled = new EventEmitter<void>();
  
  private observer: IntersectionObserver | null = null;
  private intersectionElement: HTMLElement;
  
  constructor(private elementRef: ElementRef) {
    // Create a sentinel element to observe
    this.intersectionElement = document.createElement('div');
    this.intersectionElement.style.height = '1px';
    this.intersectionElement.style.width = '100%';
    this.intersectionElement.style.position = 'absolute';
    this.intersectionElement.style.bottom = `${this.scrollThreshold}px`;
    this.intersectionElement.className = 'infinite-scroll-sentinel';
  }
  
  ngOnInit() {
    // Append the sentinel element
    if (this.elementRef.nativeElement.style.position !== 'absolute' && 
        this.elementRef.nativeElement.style.position !== 'fixed' && 
        this.elementRef.nativeElement.style.position !== 'relative') {
      this.elementRef.nativeElement.style.position = 'relative';
    }
    
    this.elementRef.nativeElement.appendChild(this.intersectionElement);
    
    // Create and configure IntersectionObserver
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.scrolled.emit();
          }
        });
      }, 
      {
        root: null, // Use viewport as root
        rootMargin: '0px',
        threshold: 0.1 // Trigger when 10% of the sentinel is visible
      }
    );
    
    // Start observing
    this.observer.observe(this.intersectionElement);
  }
  
  ngOnDestroy() {
    // Clean up observer and sentinel element
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    if (this.intersectionElement.parentNode) {
      this.intersectionElement.parentNode.removeChild(this.intersectionElement);
    }
  }
}