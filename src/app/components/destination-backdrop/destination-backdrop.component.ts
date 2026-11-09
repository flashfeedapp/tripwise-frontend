import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  PLATFORM_ID,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { Destination } from '../../models/trip.models';
import { destinationHeroImages } from '../../shared/destination-image-content';

@Component({
  selector: 'app-destination-backdrop',
  standalone: true,
  templateUrl: './destination-backdrop.component.html',
})
export class DestinationBackdropComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) destination!: Destination;
  @Input() activeIndex = 0;
  @Input() autoRotate = true;
  @ViewChild('backdrop') private backdropElement?: ElementRef<HTMLElement>;

  protected readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private slideTimer: ReturnType<typeof setInterval> | null = null;

  protected get photos() {
    return this.destination ? destinationHeroImages(this.destination) : [];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['destination']) {
      this.activeIndex = 0;
    }

    if (changes['destination'] || changes['autoRotate']) {
      this.stopSlideshow();
      if (this.isBrowser && this.autoRotate && this.photos.length > 1) {
        this.slideTimer = setInterval(() => this.nextSlide(), 5000);
      }
    }
  }

  ngOnDestroy(): void {
    this.stopSlideshow();
  }

  protected nextSlide(): void {
    if (this.photos.length < 2) {
      return;
    }

    const images = this.getImages();
    const nextIndex = this.findVisibleIndex(images, this.activeIndex);
    if (nextIndex !== -1) {
      this.activeIndex = nextIndex;
    }
  }

  protected onImageError(event: Event): void {
    const image = event.currentTarget;
    if (!(image instanceof HTMLImageElement)) {
      return;
    }

    const wasActive = image.classList.contains('active');
    image.hidden = true;
    const parent = image.parentElement;
    const images = parent ? [...parent.querySelectorAll('img')] : [];

    if (images.length > 0 && images.every((photo) => photo.hidden)) {
      parent?.classList.add('image-unavailable');
      return;
    }

    if (wasActive) {
      const currentIndex = images.indexOf(image);
      const nextIndex = this.findVisibleIndex(images, currentIndex);
      if (nextIndex !== -1) {
        this.activeIndex = nextIndex;
      }
    }
  }

  private findVisibleIndex(images: HTMLImageElement[], currentIndex: number): number {
    for (let offset = 1; offset <= images.length; offset += 1) {
      const candidate = (currentIndex + offset) % images.length;
      if (!images[candidate].hidden) {
        return candidate;
      }
    }
    return -1;
  }

  private getImages(): HTMLImageElement[] {
    return [
      ...(this.backdropElement?.nativeElement.querySelectorAll<HTMLImageElement>(
        '.destination-page-background-image',
      ) ?? []),
    ];
  }

  private stopSlideshow(): void {
    if (this.slideTimer !== null) {
      clearInterval(this.slideTimer);
      this.slideTimer = null;
    }
  }
}
