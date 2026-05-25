import React from "react";
import {Branch} from "@/modules/branch";
import {BranchCard} from "./BranchCard";

interface BranchListProps {
    branches: Branch[];
}

export const BranchList: React.FC<BranchListProps> = ({branches}) => {
    if (branches.length === 0) {
        return (
            <div className="text-center py-10 min-h-[200px] animate-fade-in-up">
                <p className="text-muted-foreground">Chưa có chi nhánh nào.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[400px] animate-fade-in-up">
            {branches.map((branch) => (
                <BranchCard key={branch.id} branch={branch}/>
            ))}
        </div>
    );
};
