import { Branch } from "./types";

export const mockBranches: Branch[] = [
  {
    id: "br-001",
    name: "Văn phòng",
    slug: "van-phong",
    address: "06 Dương Quảng Hàm, Phường 5, Gò Vấp, Hồ Chí Minh",
    phone: "0789978898",
    email: "elc.jointstock@gmail.com",
    mapsUrl:
      "https://www.google.com/maps/place/06+D%C6%B0%C6%A1ng+Qu%E1%BA%A3ng+H%C3%A0m,+Ph%C6%B0%E1%BB%9Dng+5,+H%E1%BA%A1nh+Th%C3%B4ng,+H%E1%BB%93+Ch%C3%AD+Minh,+Vietnam/@10.8277832,106.6875983,17z/data=!4m6!3m5!1s0x317528f0cd3a4b15:0x373a3f7361149689!8m2!3d10.8277779!4d106.6901732!16s%2Fg%2F11pw20b3c7?entry=ttu&g_ep=EgoyMDI2MDQwMS4wIKXMDSoASAFQAw%3D%3D",
    mapsEmbed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.784682694936!2d106.68759827689965!3d10.827783158240521!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317528f0cd3a4b15%3A0x373a3f7361149689!2zMDYgRMawxqFuZyBRdeG6o25nIEjDoG0sIFBoxrDhu51uZyA1LCBI4bqhbmggVGjDtG5nLCBI4buTIENow60gTWluaCwgVmlldG5hbQ!5e0!3m2!1sen!2s!4v1775473972161!5m2!1sen!2s",
    description: "Văn phòng điều hành chính khu vực miền Nam",
    isPublished: true,
    orderIndex: 0,
    createdAt: new Date("2026-05-01T08:00:00Z").toISOString(),
    updatedAt: new Date("2026-05-01T08:00:00Z").toISOString(),
    deletedAt: null,
  },
  {
    id: "br-002",
    name: "Chi nhánh Hà Nội",
    slug: "chi-nhanh-ha-noi",
    address: "Tòa nhà Keangnam, Phạm Hùng, Nam Từ Liêm, Hà Nội",
    phone: "0243123456",
    email: "hanoi@elc.vn",
    mapsUrl: "https://maps.google.com/?q=Keangnam+Landmark+72",
    mapsEmbed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.33145455955!2d105.78161591540216!3d21.0194186934739!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab55ec1570e3%3A0x2a3e0b3c690f05e3!2sKeangnam%20Hanoi%20Landmark%20Tower!5e0!3m2!1sen!2s!4v1655180000000!5m2!1sen!2s",
    description: "Trung tâm chăm sóc khách hàng khu vực phía Bắc",
    isPublished: true,
    orderIndex: 1,
    createdAt: new Date("2026-05-02T09:30:00Z").toISOString(),
    updatedAt: new Date("2026-05-02T09:30:00Z").toISOString(),
    deletedAt: null,
  },
  {
    id: "br-003",
    name: "Chi nhánh Đà Nẵng",
    slug: "chi-nhanh-da-nang",
    address: "123 Nguyễn Văn Linh, Quận Hải Châu, Đà Nẵng",
    phone: "0236123456",
    email: "danang@elc.vn",
    mapsUrl: "https://maps.google.com/?q=123+Nguyen+Van+Linh+Da+Nang",
    mapsEmbed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3834.004278456627!2d108.21448881536109!3d16.065279643811883!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31421834cb2c4b8d%3A0xc68222a76f2f2812!2sNguyen%20Van%20Linh%2C%20Hai%20Chau%2C%20Da%20Nang!5e0!3m2!1sen!2s!4v1655180111111!5m2!1sen!2s",
    description: "Cửa hàng trưng bày và giới thiệu sản phẩm miền Trung",
    isPublished: false,
    orderIndex: 2,
    createdAt: new Date("2026-05-03T10:15:00Z").toISOString(),
    updatedAt: new Date("2026-05-03T10:15:00Z").toISOString(),
    deletedAt: null,
  },
];
