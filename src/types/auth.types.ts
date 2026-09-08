export interface IUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: "owner";
  phone?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: "owner";
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SetupOwnerInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
}
