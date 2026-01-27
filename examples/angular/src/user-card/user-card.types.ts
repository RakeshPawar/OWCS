export interface UserCardDto {
  name: string;
  age?: number;
  email?: string;
  config?: {
    theme: 'light' | 'dark';
    showAvatar: boolean;
  };
}
