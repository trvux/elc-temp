import React from "react";
import {Branch} from "@/modules/branch";
import {Card, CardContent} from "@/shared/components/ui/card";
import {Mail, MapPin, Phone, ArrowRight} from "lucide-react";
import Link from "next/link";
import { cn } from "@/shared/lib/utils";

interface BranchCardProps {
    branch: Branch;
}

export const BranchCard: React.FC<BranchCardProps> = ({branch}) => {
    return (
        <Card className="overflow-hidden hover:shadow-md transition-shadow flex flex-col border-none bg-background/50 backdrop-blur-sm shadow-sm">
            <CardContent className="p-6 flex flex-col h-full">
                <Link href={`/chi-nhanh/${branch.slug}`} className="hover:text-primary transition-colors group">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        {branch.name}
                        <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </h3>
                </Link>
                <div className="space-y-3 text-sm flex-grow text-muted-foreground">
                    <div className="flex gap-3">
                        <MapPin className="w-5 h-5 text-primary shrink-0"/>
                        <span>{branch.address}</span>
                    </div>
                    <div className="flex gap-3">
                        <Phone className="w-5 h-5 text-primary shrink-0"/>
                        <a href={`tel:${branch.phone}`} className="hover:text-primary transition-colors">{branch.phone}</a>
                    </div>
                    <div className="flex gap-3">
                        <Mail className="w-5 h-5 text-primary shrink-0"/>
                        <a href={`mailto:${branch.email}`} className="hover:text-primary transition-colors">{branch.email}</a>
                    </div>
                </div>
                
                <div className="mt-6 grid grid-cols-2 gap-3">
                    <Link
                        href={`/chi-nhanh/${branch.slug}`}
                        className={cn(
                            "flex items-center justify-center gap-2 py-2 border border-primary text-primary rounded-md hover:bg-primary/5 transition-colors text-sm font-medium",
                            !branch.mapsUrl && "col-span-2"
                        )}
                    >
                        Xem chi tiết
                    </Link>
                    {branch.mapsUrl && (
                        <a
                            href={branch.mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-sm font-medium shadow-sm"
                        >
                            Bản đồ
                        </a>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
