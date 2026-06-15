import { createGroupSchema, updateGroupSchema } from "../domain/validators";
import { Group, CreateGroupInput, UpdateGroupInput } from "../domain/types";
import { GroupFilter, GroupRepository } from "../domain/repository";

export async function getGroups(groupRepo: GroupRepository, options?: GroupFilter): Promise<Group[]> {
  return groupRepo.getAll(options);
}

export async function getGroupById(groupRepo: GroupRepository, id: string): Promise<Group | null> {
  return groupRepo.getById(id);
}

export async function createGroup(groupRepo: GroupRepository, input: CreateGroupInput): Promise<Group> {
  const validated = createGroupSchema.parse(input);
  return groupRepo.create(validated as CreateGroupInput);
}

export async function updateGroup(groupRepo: GroupRepository, input: UpdateGroupInput): Promise<Group> {
  const validated = updateGroupSchema.parse(input);
  return groupRepo.update(validated as UpdateGroupInput);
}

export async function deleteGroup(groupRepo: GroupRepository, id: string): Promise<void> {
  return groupRepo.delete(id);
}
