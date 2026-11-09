import { Destination, DestinationImage } from '../models/trip.models';

export function destinationTextItems(value: string | null | undefined): string[] {
  return (value?.split(/\r?\n|[,;]\s*/) ?? [])
    .map((item) => item.replace(/^[\s•-]+/, '').trim())
    .filter(Boolean);
}

function orderedImages(images: DestinationImage[] | null | undefined): DestinationImage[] {
  return (images ?? [])
    .filter((image) => image.title.trim() && image.imageUrl.trim())
    .slice()
    .sort((left, right) => left.displayOrder - right.displayOrder);
}

export function destinationHeroImages(destination: Destination): DestinationImage[] {
  return orderedImages(destination.images?.hero);
}

export function destinationAttractionImages(destination: Destination): DestinationImage[] {
  return orderedImages(destination.images?.attractions);
}

export function hideBrokenDestinationImage(event: Event): void {
  const image = event.currentTarget;
  if (image instanceof HTMLImageElement) {
    image.hidden = true;
    image.parentElement?.classList.add('image-unavailable');
  }
}
