import { domAnimation } from "motion/react";

// Split into its own module so QueryProvider can load it via a dynamic
// import instead of a static one — see query-provider.tsx.
export default domAnimation;
