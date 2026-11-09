import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Destination, DestinationCategory, DestinationCategoryOption } from '../../models/trip.models';
import { TripWiseApiService } from '../../services/trip-wise-api.service';
import { apiErrorMessage } from '../../shared/api-error-message';
import { destinationHeroImages } from '../../shared/destination-image-content';
import { DestinationDiscoveryComponent } from '../destination-discovery/destination-discovery.component';

const FEATURED_DESTINATION_IMAGES = [
  {
    name: 'Araku Valley',
    state: 'Andhra Pradesh',
    imageUrl:
      'https://commons.wikimedia.org/wiki/Special:FilePath/A%20view%20of%20Araku%20Valley%20hill%20station%20in%20Andhra%20Pradesh.jpg',
    fallbackImageUrl:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Araku%20Valley%20coffee%20plantations.jpg',
  },
  {
    name: 'Munnar',
    state: 'Kerala',
    imageUrl:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Munnar%20Tea%20Plantations-WUS07257.jpg',
    fallbackImageUrl:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Munnar%20Tea%20Plantations-WUS07255.jpg',
  },
  {
    name: 'Goa',
    state: 'Goa',
    imageUrl:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Goa%20Beach%20-%20Baga%20Beach.jpg',
    fallbackImageUrl:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Baga%20Beach%20In%20North%20Goa.jpg',
  },
  {
    name: 'Jaipur',
    state: 'Rajasthan',
    imageUrl:
      'https://commons.wikimedia.org/wiki/Special:FilePath/20191218%20Hawa%20Mahal%20%28The%20Palace%20of%20Winds%29%20in%20Jaipur%2C%201150%209148.jpg',
    fallbackImageUrl:
      'https://commons.wikimedia.org/wiki/Special:FilePath/20191219%20Amber%20Fort%2C%20Amer%2C%20Jaipur%201019%209533.jpg',
  },
] as const;

interface HeroSlide {
  name: string;
  state: string;
  imageUrl: string;
  fallbackImageUrl: string;
  destination: Destination | null;
}

@Component({
  selector: 'app-trip-planner',
  standalone: true,
  imports: [DestinationDiscoveryComponent, RouterLink],
  templateUrl: './trip-planner.component.html',
})
export class TripPlannerComponent implements OnDestroy, OnInit {
  protected readonly backgroundLayers = [0, 1] as const;
  protected destinations: Destination[] = [];
  protected heroSlides: HeroSlide[] = FEATURED_DESTINATION_IMAGES.map((place) => ({
    ...place,
    fallbackImageUrl: place.imageUrl,
    destination: null,
  }));
  protected heroLayerIndices: [number | null, number | null] = [0, 1];
  protected activeHeroLayer = 0;
  protected activeHeroIndex = 0;
  protected activeCategory: DestinationCategory | 'ALL' = 'ALL';
  protected activeState = 'ALL';
  protected searchQuery = '';
  protected loading = true;
  protected errorMessage = '';
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private heroTimer: ReturnType<typeof setInterval> | null = null;
  private readonly imageLoads = new Map<string, Promise<boolean>>();
  protected readonly failedHeroImageUrls = new Set<string>();
  private heroSlidesGeneration = 0;
  private heroSlideRequestId = 0;

  constructor(
    private readonly api: TripWiseApiService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.startHeroSlideshow();
    this.preloadHeroImages();
    this.loadDestinations();
  }

  ngOnDestroy(): void {
    this.stopHeroSlideshow();
  }

  protected get categories(): DestinationCategoryOption[] {
    const availableCategories = new Set(this.destinations.map((destination) => destination.category));
    const filters: DestinationCategoryOption[] = [
      { id: 'ALL', name: 'All', emoji: '✧', heading: 'All destinations' },
      {
        id: 'NATURE_AND_HILLS',
        name: 'Nature & Hills',
        emoji: this.categoryEmoji('NATURE_AND_HILLS'),
        heading: 'Explore nature & hills',
      },
      {
        id: 'BEACHES',
        name: 'Beaches',
        emoji: this.categoryEmoji('BEACHES'),
        heading: 'Explore beaches',
      },
      {
        id: 'HISTORY_AND_CULTURE',
        name: 'Heritage & Culture',
        emoji: this.categoryEmoji('HISTORY_AND_CULTURE'),
        heading: 'Explore heritage & culture',
      },
    ];
    return filters.filter(
      (filter) => filter.id === 'ALL' || availableCategories.has(filter.id),
    );
  }

  protected get states(): string[] {
    return [...new Set(this.destinations.map((destination) => destination.state))].sort((a, b) =>
      a.localeCompare(b),
    );
  }

  protected get visibleDestinations(): Destination[] {
    const query = this.searchQuery.trim().toLocaleLowerCase();
    return this.destinations.filter((destination) => {
      const matchesCategory =
        this.activeCategory === 'ALL' || destination.category === this.activeCategory;
      const matchesState = this.activeState === 'ALL' || destination.state === this.activeState;
      const matchesSearch =
        !query ||
        [
          destination.name,
          destination.state,
          destination.category,
          destination.shortDescription ?? '',
          destination.bestSeason ?? '',
        ]
          .join(' ')
          .toLocaleLowerCase()
          .includes(query);
      return matchesCategory && matchesState && matchesSearch;
    });
  }

  protected setCategory(category: DestinationCategory | 'ALL'): void {
    this.activeCategory = category;
  }

  protected setState(state: string): void {
    this.activeState = state;
  }

  protected updateSearch(query: string): void {
    this.searchQuery = query;
  }

  protected clearFilters(): void {
    this.activeCategory = 'ALL';
    this.activeState = 'ALL';
    this.searchQuery = '';
  }

  protected openDestination(destination: Destination): void {
    void this.router.navigate(['/destinations', destination.id]);
  }

  protected retry(): void {
    this.loadDestinations();
  }

  protected formatCategory(category: DestinationCategory): string {
    return category
      .replaceAll('_AND_', ' & ')
      .replaceAll('_', ' ')
      .split(' ')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }

  protected categoryEmoji(category: DestinationCategory): string {
    const emoji: Record<DestinationCategory, string> = {
      NATURE_AND_HILLS: '🌿',
      BEACHES: '🏖️',
      FOREST_AND_WILDLIFE: '🌲',
      HISTORY_AND_CULTURE: '🏛️',
      SPIRITUAL_PLACES: '🪷',
    };
    return emoji[category];
  }

  protected nextHeroSlide(): void {
    if (!this.isBrowser || this.heroSlides.length < 2) {
      return;
    }

    const candidate = this.findNextHeroSlide();
    if (candidate !== null) {
      void this.showHeroSlide(candidate);
    }
  }

  protected selectHeroSlide(index: number): void {
    if (
      index >= 0 &&
      index < this.heroSlides.length &&
      !this.failedHeroImageUrls.has(this.heroSlides[index].imageUrl)
    ) {
      void this.showHeroSlide(index);
    }
  }

  protected heroBackground(index: number | null): string | null {
    const imageUrl = index === null ? null : this.heroSlides[index]?.imageUrl;
    return imageUrl ? `url("${imageUrl}")` : null;
  }

  private loadDestinations(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api.getDestinations().subscribe({
      next: (destinations) => {
        this.destinations = destinations;
        this.heroSlides = FEATURED_DESTINATION_IMAGES.map((featured) => {
          const destination = destinations.find(
            (place) => place.name.toLocaleLowerCase() === featured.name.toLocaleLowerCase(),
          );
          const photos = destination ? destinationHeroImages(destination) : [];
          const imageUrl = photos[0]?.imageUrl ?? featured.imageUrl;
          return {
            ...featured,
            imageUrl,
            fallbackImageUrl: photos[1]?.imageUrl ?? featured.fallbackImageUrl,
            destination: destination ?? null,
          };
        });
        this.heroSlidesGeneration += 1;
        this.failedHeroImageUrls.clear();
        this.imageLoads.clear();
        this.heroLayerIndices = [0, 1];
        this.activeHeroLayer = 0;
        this.activeHeroIndex = 0;
        this.preloadHeroImages();
        this.startHeroSlideshow();
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        if (!environment.production) {
          console.error('Failed to load destinations from the TripWise API.', error);
        }
        this.errorMessage = apiErrorMessage(error, 'Destinations');
        this.loading = false;
      },
    });
  }

  private startHeroSlideshow(): void {
    this.stopHeroSlideshow();
    if (this.isBrowser && this.heroSlides.length > 1) {
      this.heroTimer = setInterval(() => this.nextHeroSlide(), 5000);
    }
  }

  private stopHeroSlideshow(): void {
    if (this.heroTimer !== null) {
      clearInterval(this.heroTimer);
      this.heroTimer = null;
    }
  }

  private preloadHeroImages(generation = this.heroSlidesGeneration): void {
    if (this.isBrowser) {
      this.heroSlides.forEach((_slide, index) => void this.preloadHeroImage(index, generation));
    }
  }

  private async preloadHeroImage(index: number, generation: number): Promise<boolean> {
    const slide = this.heroSlides[index];
    if (!slide) {
      return false;
    }

    let loaded = await this.loadImage(slide.imageUrl);
    if (!loaded && slide.fallbackImageUrl !== slide.imageUrl) {
      if (generation !== this.heroSlidesGeneration) {
        return false;
      }
      this.heroSlides[index] = { ...this.heroSlides[index], imageUrl: slide.fallbackImageUrl };
      loaded = await this.loadImage(slide.fallbackImageUrl);
    }

    if (generation !== this.heroSlidesGeneration) {
      return false;
    }
    if (!loaded) {
      this.failedHeroImageUrls.add(this.heroSlides[index].imageUrl);
    }
    return loaded;
  }

  private loadImage(imageUrl: string): Promise<boolean> {
    const existingLoad = this.imageLoads.get(imageUrl);
    if (existingLoad) {
      return existingLoad;
    }

    const load = new Promise<boolean>((resolve) => {
      const image = new Image();
      image.onload = () => resolve(true);
      image.onerror = () => resolve(false);
      image.src = imageUrl;
    });
    this.imageLoads.set(imageUrl, load);
    return load;
  }

  private findNextHeroSlide(): number | null {
    for (let offset = 1; offset <= this.heroSlides.length; offset += 1) {
      const candidate = (this.activeHeroIndex + offset) % this.heroSlides.length;
      if (!this.failedHeroImageUrls.has(this.heroSlides[candidate].imageUrl)) {
        return candidate;
      }
    }
    return null;
  }

  private async showHeroSlide(index: number): Promise<void> {
    const generation = this.heroSlidesGeneration;
    const requestId = ++this.heroSlideRequestId;
    if (!(await this.preloadHeroImage(index, generation))) {
      if (
        requestId === this.heroSlideRequestId &&
        this.failedHeroImageUrls.size < this.heroSlides.length
      ) {
        const nextCandidate = this.findNextHeroSlide();
        if (nextCandidate !== null && nextCandidate !== index) {
          await this.showHeroSlide(nextCandidate);
        }
      }
      return;
    }
    if (generation !== this.heroSlidesGeneration || requestId !== this.heroSlideRequestId) {
      return;
    }

    if (index === this.activeHeroIndex) {
      return;
    }

    const nextLayer = this.activeHeroLayer === 0 ? 1 : 0;
    const nextIndices: [number | null, number | null] = [...this.heroLayerIndices];
    nextIndices[nextLayer] = index;
    this.heroLayerIndices = nextIndices;
    this.activeHeroLayer = nextLayer;
    this.activeHeroIndex = index;
  }
}
