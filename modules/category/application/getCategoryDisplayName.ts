export function getCategoryDisplayName(category: { name: string; parentId?: string | null }) {
  const isAirCondChild = category.parentId === "f300f65c-bab7-4351-9a3f-3ef22e5d3b02";
  
  if (isAirCondChild && !category.name.toLowerCase().includes("máy lạnh")) {
    return `Máy lạnh ${category.name.toLowerCase()}`;
  }
  
  return category.name;
}
