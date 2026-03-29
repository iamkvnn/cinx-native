import { mockHomeDashboard } from "../mocks/mockHomeDashboard";
import type { HomeDashboardData } from "../../types/home";

const getRandomDelay = (): number => {
  return Math.floor(Math.random() * (1500 - 500 + 1)) + 500;
};

export const fetchHomeDashboardMock = async (): Promise<HomeDashboardData> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockHomeDashboard), getRandomDelay());
  });
};
