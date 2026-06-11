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
                <p className="text-muted-foreground">Chưa có cơ sở hạ tầng nào.</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto w-full">
            <div className="flex flex-col w-full min-h-[400px] animate-fade-in-up">
                {branches.map((branch, index) => (
                    <BranchCard key={branch.id} branch={branch} priority={index < 2}/>
                ))}
            </div>
        </div>
    );
};
