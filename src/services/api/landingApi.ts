import type { LandingPageData } from "../../types/landing";
import { mockLandingPageData } from "../mocks/mockLandingData";

function withNetworkDelay<T>(data: T): Promise<T> {
  const delayMs = 500 + Math.floor(Math.random() * 1000);

  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delayMs);
  });
}

export async function fetchLandingPageDataMock(): Promise<LandingPageData> {
  return withNetworkDelay(mockLandingPageData);
}
