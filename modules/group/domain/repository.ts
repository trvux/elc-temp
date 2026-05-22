import { Group, CreateGroupInput, UpdateGroupInput } from "./types";

export interface GroupFilter {
  search?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}

export interface GroupRepository {
  getAll(options?: GroupFilter): Promise<Group[]>;
  count(options?: Pick<GroupFilter, "search" | "includeDeleted">): Promise<number>;
  getById(id: string): Promise<Group | null>;
  create(input: CreateGroupInput): Promise<Group>;
  update(input: UpdateGroupInput): Promise<Group>;
  delete(id: string): Promise<void>;
}
