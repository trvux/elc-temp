import React from "react";
import {Branch} from "@/modules/branch";
import {BranchCard} from "./BranchCard";

interface BranchListProps {
    branches: Branch[];
}

export const BranchList: React.FC<BranchListProps> = ({branches}) => {
    if (branches.length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-muted-foreground">Chưa có chi nhánh nào.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map((branch) => (
                <BranchCard key={branch.id} branch={branch}/>
            ))}
        </div>
    );
};
