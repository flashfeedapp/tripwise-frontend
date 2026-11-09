import { TripPlanDetails, TripPlanOption, TripPlanType } from '../models/trip.models';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isTripPlanDetails(value: unknown): value is TripPlanDetails | null {
  if (value === null || value === undefined) {
    return true;
  }

  if (!isRecord(value)) {
    return false;
  }

  return (
    (value['itinerary'] === undefined ||
      value['itinerary'] === null ||
      Array.isArray(value['itinerary'])) &&
    (value['inclusions'] === undefined ||
      value['inclusions'] === null ||
      Array.isArray(value['inclusions'])) &&
    (value['exclusions'] === undefined ||
      value['exclusions'] === null ||
      Array.isArray(value['exclusions'])) &&
    (value['notes'] === undefined || value['notes'] === null || Array.isArray(value['notes']))
  );
}

export function tripPlanFromRouterState(
  state: unknown,
  destinationId: number,
  planType: TripPlanType,
): TripPlanOption | null {
  if (!isRecord(state)) {
    return null;
  }

  const plan = state['plan'];
  if (
    !isRecord(plan) ||
    plan['destinationId'] !== destinationId ||
    plan['planType'] !== planType ||
    typeof plan['id'] !== 'number' ||
    typeof plan['title'] !== 'string' ||
    typeof plan['description'] !== 'string' ||
    typeof plan['durationDays'] !== 'number' ||
    typeof plan['estimatedStayCost'] !== 'number' ||
    typeof plan['estimatedFoodCost'] !== 'number' ||
    typeof plan['estimatedActivityCost'] !== 'number' ||
    typeof plan['active'] !== 'boolean' ||
    !isTripPlanDetails(plan['detailsJson'])
  ) {
    return null;
  }

  return {
    id: plan['id'],
    destinationId,
    planType,
    title: plan['title'],
    description: plan['description'],
    durationDays: plan['durationDays'],
    estimatedStayCost: plan['estimatedStayCost'],
    estimatedFoodCost: plan['estimatedFoodCost'],
    estimatedActivityCost: plan['estimatedActivityCost'],
    active: plan['active'],
    detailsJson: plan['detailsJson'],
  };
}
