export interface UserModel {
  uid: string;
  email: string | null;
  displayName: string | null;
  token: string;
  rol: string;
}
