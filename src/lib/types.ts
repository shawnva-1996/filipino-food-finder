export interface UserProfile {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  role?: 'user' | 'admin' | 'super_admin'; 
}

export interface DishReview {
  id?: string;
  restaurantId: string | number;
  userId: string;
  userName: string;
  userPhoto?: string;
  dishName: string; 
  rating: number; 
  comment: string;
  imageUrl?: string; // <--- RESTORED THIS FIELD
  createdAt: any; 
  updatedAt?: any;
}