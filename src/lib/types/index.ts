import { Enums, TablesInsert, TablesUpdate } from "../api/types";

export type PersonalDetails = {
  first_name: string;
  middle_name: string;
  last_name: string;
  date_of_birth: string | null;
  gender: Enums<"gender">;
  admission_date: string | null;
  avatarFile: File | null;
};
export type EditPersonalDetails = TablesUpdate<"students"> & {
  avatarFile?: File | null;
};

export type AddressRecord =
  | TablesInsert<"addresses">
  | TablesUpdate<"addresses">;
export type AddressInsert = TablesInsert<"addresses">;
export type AddressUpdate = TablesUpdate<"addresses">;
