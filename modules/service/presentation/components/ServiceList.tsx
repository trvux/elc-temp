import React from "react";
import {Service} from "@/modules/service";
import {ServiceCard} from "./ServiceCard";

interface ServiceListProps {
    services: Service[];
}

export const ServiceList: React.FC<ServiceListProps> = ({services}) => {
    if (services.length === 0) {
        return (
            <div className="text-center py-20">
                <p className="text-muted-foreground">Chưa có dịch vụ nào.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {services.map((service) => (
                <ServiceCard key={service.id} service={service}/>
            ))}
        </div>
    );
};
