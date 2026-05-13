import { faZ } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

export function ZaloIcon({ size = 14, className }: IconProps) {
  return (
    <FontAwesomeIcon
      icon={faZ}
      style={{ width: size, height: size }}
      className={className}
    />
  );
}
