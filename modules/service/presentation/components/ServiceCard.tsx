import React from "react";
import Link from "next/link";
import Image from "next/image";
import {Service} from "@/modules/service";
import {Card, CardContent} from "@/shared/components/ui/card";

interface ServiceCardProps {
    service: Service;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({service}) => {
    return (
        <Card
            className="overflow-hidden h-full flex flex-col group hover:shadow-lg transition-all duration-300 border-none bg-muted/30">
            <Link href={`/dich-vu/${service.slug}`} className="relative aspect-video block overflow-hidden">
                <Image
                    src={service.image || "/placeholder.png"}
                    alt={service.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors"/>
            </Link>
            <CardContent className="p-6 text-center">
                <Link href={`/dich-vu/${service.slug}`}>
                    <h3 className="font-bold text-xl group-hover:text-primary transition-colors">
                        {service.title}
                    </h3>
                </Link>
            </CardContent>
        </Card>
    );
};
