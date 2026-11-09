import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  Destination,
  DestinationCategory,
  DestinationCategoryOption,
} from '../../models/trip.models';
import { hideBrokenDestinationImage } from '../../shared/destination-image-content';

@Component({
  selector: 'app-destination-discovery',
  standalone: true,
  templateUrl: './destination-discovery.component.html',
})
export class DestinationDiscoveryComponent {
  @Input({ required: true }) categories: DestinationCategoryOption[] = [];
  @Input({ required: true }) activeCategory: DestinationCategory | 'ALL' = 'ALL';
  @Input({ required: true }) states: string[] = [];
  @Input({ required: true }) activeState = 'ALL';
  @Input({ required: true }) destinations: Destination[] = [];
  @Input() selectedDestinationId: string | null = null;
  @Input() searchQuery = '';

  @Output() readonly categoryChange = new EventEmitter<DestinationCategory | 'ALL'>();
  @Output() readonly stateChange = new EventEmitter<string>();
  @Output() readonly destinationSelect = new EventEmitter<Destination>();
  @Output() readonly searchChange = new EventEmitter<string>();
  @Output() readonly clearFilters = new EventEmitter<void>();

  protected get categoryHeading(): string {
    return (
      this.categories.find((category) => category.id === this.activeCategory)?.heading ??
      'A few places to fall for'
    );
  }

  protected categoryLabel(category: DestinationCategory): string {
    return category
      .replaceAll('_AND_', ' & ')
      .replaceAll('_', ' ')
      .split(' ')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }

  protected onImageError(event: Event): void {
    hideBrokenDestinationImage(event);
  }

  protected onSearchInput(event: Event): void {
    const input = event.currentTarget;
    if (input instanceof HTMLInputElement) {
      this.searchChange.emit(input.value);
    }
  }

  protected onStateChange(event: Event): void {
    const select = event.currentTarget;
    if (select instanceof HTMLSelectElement) {
      this.stateChange.emit(select.value);
    }
  }
}
