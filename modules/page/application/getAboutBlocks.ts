import {aboutBlockRepo} from "@/modules/page/infrastructure";

export const getAboutBlocks = () => {
    return aboutBlockRepo.getAll();
};
