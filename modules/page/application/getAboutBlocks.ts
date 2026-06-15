import { AboutBlockRepository } from "../domain";

export const getAboutBlocks = (aboutBlockRepo: AboutBlockRepository) => {
    return aboutBlockRepo.getAll();
};
