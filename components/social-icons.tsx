import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faFacebook, 
  faFacebookMessenger, 
  faTiktok, 
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import {
  faZ,
  faPhone,
  faEnvelope,
  faGlobe,
  faLink,
} from "@fortawesome/free-solid-svg-icons";
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

export function FacebookIcon({ size = 16, className }: IconProps) {
  return (
    <FontAwesomeIcon icon={faFacebook} style={{ width: size, height: size }} className={className} />
  );
}

export function MessengerIcon({ size = 16, className }: IconProps) {
  return (
    <FontAwesomeIcon icon={faFacebookMessenger} style={{ width: size, height: size }} className={className} />
  );
}

export function ZaloIcon({ size = 16, className }: IconProps) {
  return (
    <FontAwesomeIcon icon={faZ} style={{ width: size * 0.8, height: size * 0.8 }} className={className} />
  );
}

export function TiktokIcon({ size = 16, className }: IconProps) {
  return (
    <FontAwesomeIcon icon={faTiktok} style={{ width: size, height: size }} className={className} />
  );
}

export function YoutubeIcon({ size = 16, className }: IconProps) {
  return (
    <FontAwesomeIcon icon={faYoutube} style={{ width: size, height: size }} className={className} />
  );
}

export function PhoneIcon({ size = 16, className }: IconProps) {
  return (
    <FontAwesomeIcon icon={faPhone} style={{ width: size, height: size }} className={className} />
  );
}

export function EmailIcon({ size = 16, className }: IconProps) {
  return (
    <FontAwesomeIcon icon={faEnvelope} style={{ width: size, height: size }} className={className} />
  );
}

export function WebsiteIcon({ size = 16, className }: IconProps) {
  return (
    <FontAwesomeIcon icon={faGlobe} style={{ width: size, height: size }} className={className} />
  );
}

export function LinkIcon({ size = 16, className }: IconProps) {
  return (
    <FontAwesomeIcon icon={faLink} style={{ width: size, height: size }} className={className} />
  );
}
