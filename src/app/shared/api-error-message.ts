import { HttpErrorResponse } from '@angular/common/http';

export function apiErrorMessage(error: unknown, resource: string): string {
  if (!(error instanceof HttpErrorResponse)) {
    return `An unexpected error occurred while loading ${resource.toLowerCase()}.`;
  }
  if (error.status === 0) {
    return 'The travel service is unavailable. Check that the backend is running and try again.';
  }
  if (error.status === 404) {
    return `${resource} could not be found. It may have been removed or is temporarily unavailable.`;
  }
  return `${resource} could not be loaded (HTTP ${error.status}). Please try again.`;
}
