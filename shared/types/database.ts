import { Tables } from "@/database.types";

export type Category = Tables<"categories">;

export type JoinedCategory = Category & {
  parent?: Category | null;
};

export type Project = Tables<"projects">;

export type JoinedProject = Project & {
  categories?: JoinedCategory | JoinedCategory[] | null;
};
