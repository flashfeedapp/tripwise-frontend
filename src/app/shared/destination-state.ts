import { Destination, DestinationCategory } from '../models/trip.models';

const DESTINATION_CATEGORIES: DestinationCategory[] = [
  'NATURE_AND_HILLS',
  'BEACHES',
  'FOREST_AND_WILDLIFE',
  'HISTORY_AND_CULTURE',
  'SPIRITUAL_PLACES',
];

export function destinationFromRouterState(state: unknown, expectedId: number): Destination | null {
  if (typeof state !== 'object' || state === null || !('destination' in state)) {
    return null;
  }

  const destination = state.destination;
  if (typeof destination !== 'object' || destination === null) {
    return null;
  }

  const candidate = destination as Partial<Destination>;
  if (
    candidate.id !== expectedId ||
    typeof candidate.name !== 'string' ||
    typeof candidate.state !== 'string' ||
    !DESTINATION_CATEGORIES.includes(candidate.category as DestinationCategory)
  ) {
    return null;
  }

  return candidate as Destination;
}
