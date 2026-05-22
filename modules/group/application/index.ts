import { createGroupSchema, updateGroupSchema } from "../domain/validators";
import { groupRepo } from "../infrastructure/groupRepo";
import { Group, CreateGroupInput, UpdateGroupInput } from "../domain/types";
import { GroupFilter } from "../domain/repository";

export async function getGroups(options?: GroupFilter): Promise<Group[]> {
  return groupRepo.getAll(options);
}

export async function getGroupById(id: string): Promise<Group | null> {
  return groupRepo.getById(id);
}

export async function createGroup(input: CreateGroupInput): Promise<Group> {
  const validated = createGroupSchema.parse(input);
  return groupRepo.create(validated as CreateGroupInput);
}

export async function updateGroup(input: UpdateGroupInput): Promise<Group> {
  const validated = updateGroupSchema.parse(input);
  return groupRepo.update(validated as UpdateGroupInput);
}

export async function deleteGroup(id: string): Promise<void> {
  return groupRepo.delete(id);
}
