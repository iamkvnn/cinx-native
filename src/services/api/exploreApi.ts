import { mockExploreData } from "../mocks/mockExploreData";
import type { ExploreData } from "../../types/explore";

const getRandomDelay = (): number => {
  return Math.floor(Math.random() * (1500 - 500 + 1)) + 500;
};

export const fetchExploreDataMock = async (): Promise<ExploreData> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockExploreData), getRandomDelay());
  });
};
