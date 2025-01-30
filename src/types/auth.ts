export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  gender: 'male' | 'female' | 'other';
  bodyType: 'slim' | 'athletic' | 'average' | 'plus';
  measurements: {
    height: number;
    weight: number;
    chest: number;
    waist: number;
    hips?: number;
  };
}

export interface UserProfile extends User {
  created_at?: string;
  updated_at?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
}

export type SignUpFormValues = {
  id?: string;
  name: string;
  email: string;
  password: string;
  gender: 'male' | 'female' | 'other';
  bodyType: 'slim' | 'athletic' | 'average' | 'plus';
  measurements: {
    height: number;
    weight: number;
    chest: number;
    waist: number;
    hips?: number;
  };
};
