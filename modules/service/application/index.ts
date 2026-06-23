import { CreateServiceInput, UpdateServiceInput, ServiceFilter, ServiceWithRelations, Service } from "../domain/types";
import { ServiceRepository } from "../domain/repository";
import { ServiceGroupRepository } from "@/modules/service-group/domain/repository";
import { getServiceGroups } from "@/modules/service-group/application";

export interface GroupedServices {
  name: string;
  orderIndex: number;
  items: ServiceWithRelations[];
  createdAt: string;
}

export async function getServices(serviceRepo: ServiceRepository, options?: ServiceFilter): Promise<ServiceWithRelations[]> {
  return serviceRepo.getAll(options);
}

export async function getPublishedServicesGrouped(
  serviceRepo: ServiceRepository,
  serviceGroupRepo: ServiceGroupRepository
): Promise<GroupedServices[]> {
  const [allServices, allGroups] = await Promise.all([
    getServices(serviceRepo, { isPublished: true }),
    getServiceGroups(serviceGroupRepo, { includeDeleted: false })
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
}

export async function getServiceById(serviceRepo: ServiceRepository, id: string): Promise<ServiceWithRelations | null> {
  return serviceRepo.getById(id);
}

export async function getServiceBySlug(serviceRepo: ServiceRepository, slug: string): Promise<ServiceWithRelations | null> {
  return serviceRepo.getBySlug(slug);
}

export async function createService(serviceRepo: ServiceRepository, input: CreateServiceInput): Promise<Service> {
  return serviceRepo.create(input);
}

export async function updateService(serviceRepo: ServiceRepository, input: UpdateServiceInput): Promise<Service> {
  return serviceRepo.update(input);
}

export async function deleteService(serviceRepo: ServiceRepository, id: string): Promise<void> {
  return serviceRepo.softDelete(id);
}

export async function restoreService(serviceRepo: ServiceRepository, id: string): Promise<void> {
  return serviceRepo.restore(id);
}

export interface AdjacentService {
  title: string;
  slug: string;
}

export interface AdjacentServices {
  prev: AdjacentService | null;
  next: AdjacentService | null;
}

export async function getAdjacentServices(
  serviceRepo: ServiceRepository,
  service: Pick<ServiceWithRelations, "id" | "groupId">,
): Promise<AdjacentServices> {
  // Uu tien cac dich vu cung nhom
  let siblings = await getServices(serviceRepo, {
    isPublished: true,
    groupId: service.groupId || undefined,
  });

  // Fallback: gom toan bo dich vu neu nhom qua it
  if (siblings.length < 2) {
    siblings = await getServices(serviceRepo, { isPublished: true });
  }

  const sorted = [...siblings].sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return a.orderIndex - b.orderIndex;
  });

  const currentIndex = sorted.findIndex((s) => s.id === service.id);
  if (currentIndex === -1 || sorted.length < 2) {
    return { prev: null, next: null };
  }

  const toItem = (s: ServiceWithRelations): AdjacentService => ({
    title: s.title,
    slug: s.slug || "",
  });

  const prev = currentIndex > 0 ? toItem(sorted[currentIndex - 1]) : null;
  const next =
    currentIndex < sorted.length - 1 ? toItem(sorted[currentIndex + 1]) : null;

  return { prev, next };
}
