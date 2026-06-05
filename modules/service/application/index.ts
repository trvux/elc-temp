import { serviceRepo } from "../infrastructure/serviceRepo";
import { CreateServiceInput, UpdateServiceInput, ServiceFilter, ServiceWithRelations } from "../domain/types";

export interface GroupedServices {
  name: string;
  orderIndex: number;
  items: ServiceWithRelations[];
  createdAt: string;
}

export const getServices = async (options?: ServiceFilter) => {
  return serviceRepo.getAll(options);
};

import { getServiceGroups } from "@/modules/service-group/application";

export const getPublishedServicesGrouped = async (): Promise<GroupedServices[]> => {
  const [allServices, allGroups] = await Promise.all([
    getServices({ isPublished: true }),
    getServiceGroups({ includeDeleted: false })
  ]);

  const groupsMap = new Map<
    string,
    { name: string; orderIndex: number; items: ServiceWithRelations[]; createdAt: string }
  >();

  // Initialize all service groups first
  allGroups.forEach((group) => {
    groupsMap.set(group.id, {
      name: group.name,
      orderIndex: group.orderIndex,
      items: [],
      createdAt: group.createdAt,
    });
  });

  // Also initialize "Khác" if there are any ungrouped services
  const hasUngroupedServices = allServices.some((s) => !s.groupId);
  if (hasUngroupedServices && !groupsMap.has("khac")) {
    groupsMap.set("khac", {
      name: "Khác",
      orderIndex: 9999,
      items: [],
      createdAt: new Date().toISOString(), // Newest
    });
  }

  // Populate services into their groups
  allServices.forEach((service) => {
    const groupId = service.groupId || "khac";
    if (groupsMap.has(groupId)) {
      groupsMap.get(groupId)!.items.push(service);
    } else {
      // Fallback for safety
      const groupName = service.group?.name || "Khác";
      const groupOrder = service.group?.orderIndex ?? 9999;
      const groupCreatedAt = service.group?.createdAt || new Date().toISOString();
      groupsMap.set(groupId, {
        name: groupName,
        orderIndex: groupOrder,
        items: [service],
        createdAt: groupCreatedAt,
      });
    }
  });

  // Sort groups: orderIndex asc, then createdAt asc (oldest -> newest)
  return Array.from(groupsMap.values()).sort((a, b) => {
    if (a.orderIndex !== b.orderIndex) {
      return a.orderIndex - b.orderIndex;
    }
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return aTime - bTime;
  });
};

export const getServiceById = async (id: string) => {
  return serviceRepo.getById(id);
};

export const getServiceBySlug = async (slug: string) => {
  return serviceRepo.getBySlug(slug);
};

export const createService = async (input: CreateServiceInput) => {
  return serviceRepo.create(input);
};

export const updateService = async (input: UpdateServiceInput) => {
  return serviceRepo.update(input);
};

export const deleteService = async (id: string) => {
  return serviceRepo.softDelete(id);
};

export const restoreService = async (id: string) => {
  return serviceRepo.restore(id);
};
