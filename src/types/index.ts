export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  fullName: string;
  phone: string;
  bio: string;
  avatarUrl: string;
  createdAt: Date;
}

export interface PublicUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  bio: string;
  avatarUrl: string;
}
