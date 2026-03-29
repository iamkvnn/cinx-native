import {
  mockMenuItems,
  mockUserProfile,
  mockUserStats,
} from "../mocks/mockProfileData";
import type {
  UpdateProfilePayload,
  UserProfile,
  UserProfileData,
  UserStats,
} from "../../types/profile";

const getRandomDelay = () => Math.floor(Math.random() * 1000) + 500;

export const fetchUserProfileMock = async (): Promise<UserProfile> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockUserProfile);
    }, getRandomDelay());
  });
};

export const fetchUserStatsMock = async (): Promise<UserStats> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockUserStats);
    }, getRandomDelay());
  });
};

export const fetchUserProfileDataMock = async (): Promise<UserProfileData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        profile: mockUserProfile,
        stats: mockUserStats,
        menuItems: mockMenuItems,
      });
    }, getRandomDelay());
  });
};

export const updateUserProfileMock = async (
  payload: UpdateProfilePayload,
): Promise<UserProfile> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate update by returning modified profile
      const updatedProfile: UserProfile = {
        ...mockUserProfile,
        ...payload,
      };
      resolve(updatedProfile);
    }, getRandomDelay());
  });
};
