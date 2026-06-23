import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface FAQItem {
  question: string;
  answer: string;
}

interface ContentBlock {
  content: string;
  faq: FAQItem[];
}

// 1. Templates for Categories
const CATEGORY_CONTENT: Record<string, ContentBlock> = {
  "may-lanh-ap-tran": {
    content: `
      <p>Máy lạnh áp trần (điều hòa áp trần) là dòng máy lạnh thương mại được thiết kế lắp đặt sát trần nhà. Với công suất lớn, dòng máy này phù hợp cho các không gian rộng như nhà hàng, văn phòng làm việc, cửa hàng tiện lợi, hoặc các căn hộ có không gian sinh hoạt chung lớn.</p>
      <h2>Tại sao nên chọn máy lạnh áp trần cho không gian rộng?</h2>
      <ul>
        <li><strong>Hiệu suất làm mát mạnh mẽ:</strong> Luồng gió thổi mạnh, phân phối khí lạnh xa và rộng khắp căn phòng, giúp làm mát nhanh chóng ngay cả trong không gian đông người.</li>
        <li><strong>Tiết kiệm diện tích:</strong> Lắp đặt áp sát trần giúp tối ưu diện tích sàn và không làm ảnh hưởng đến thẩm mỹ nội thất.</li>
        <li><strong>Độ bền cao và dễ bảo trì:</strong> Dòng máy này hoạt động bền bỉ trong thời gian dài và rất thuận tiện cho việc vệ sinh, bảo dưỡng định kỳ.</li>
      </ul>
      <h2>Bảng so sánh nhanh các dòng máy lạnh áp trần phổ biến</h2>
      <table class="w-full border-collapse border border-gray-200 my-4">
        <thead>
          <tr class="bg-gray-100">
            <th class="border border-gray-200 px-4 py-2">Thương hiệu</th>
            <th class="border border-gray-200 px-4 py-2">Công nghệ nổi bật</th>
            <th class="border border-gray-200 px-4 py-2">Giá tham khảo</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="border border-gray-200 px-4 py-2">Daikin</td>
            <td class="border border-gray-200 px-4 py-2">Luồng gió dễ chịu, Tiết kiệm điện Inverter, Dàn tản nhiệt chống ăn mòn</td>
            <td class="border border-gray-200 px-4 py-2">Liên hệ báo giá tốt nhất</td>
          </tr>
          <tr>
            <td class="border border-gray-200 px-4 py-2">Reetech</td>
            <td class="border border-gray-200 px-4 py-2">Làm lạnh nhanh, Chống ăn mòn bền bỉ, Giá cạnh tranh</td>
            <td class="border border-gray-200 px-4 py-2">Liên hệ báo giá tốt nhất</td>
          </tr>
        </tbody>
      </table>
    `,
    faq: [
      {
        question: "Máy lạnh áp trần khác gì máy lạnh âm trần?",
        answer: "Máy lạnh áp trần lắp sát bề mặt trần nhà và phần thân máy lộ ra ngoài trần. Trong khi đó, máy lạnh âm trần được lắp đặt giấu hoàn toàn trong trần thạch cao, chỉ lộ ra phần mặt nạ gió thổi."
      },
      {
        question: "Lắp máy lạnh áp trần có cần thi công trần thạch cao trước không?",
        answer: "Không cần. Đây là ưu điểm lớn của máy lạnh áp trần, giúp lắp đặt nhanh chóng trên trần bê tông hoặc bất kỳ bề mặt trần nào mà không bắt buộc phải làm trần thạch cao giả."
      }
    ]
  },
  "may-cap-khi-tuoi-loc-khong-khi": {
    content: `
      <p>Hệ thống máy cấp gió tươi và lọc không khí là giải pháp công nghệ hiện đại giúp đưa không khí sạch từ ngoài trời vào trong nhà, đồng thời hút khí thải và CO2 ra ngoài. Hệ thống này giúp không gian sống luôn thoáng mát, giàu oxy và giảm thiểu bụi mịn hiệu quả.</p>
      <h2>Lợi ích sức khỏe vượt trội của hệ thống cấp khí tươi</h2>
      <ul>
        <li><strong>Cung cấp oxy liên tục:</strong> Khắc phục triệt để tình trạng thiếu oxy, mệt mỏi, đau đầu khi ở trong phòng máy lạnh đóng kín cửa thời gian dài.</li>
        <li><strong>Lọc bụi mịn PM2.5 vượt trội:</strong> Tích hợp các màng lọc HEPA tiêu chuẩn quốc tế giúp loại bỏ tới 99% bụi mịn, phấn hoa, vi khuẩn và tác nhân gây dị ứng.</li>
        <li><strong>Hệ thống thu hồi nhiệt (ERV/HRV):</strong> Giúp trao đổi nhiệt giữa khí thải và khí tươi cấp vào, tránh làm thất thoát nhiệt máy lạnh, tiết kiệm điện năng tối đa.</li>
      </ul>
    `,
    faq: [
      {
        question: "Cấp khí tươi hồi nhiệt ERV là gì?",
        answer: "ERV là công nghệ giúp trao đổi độ ẩm và nhiệt độ giữa luồng khí thải từ trong phòng đi ra và luồng khí tươi đi vào, giữ cho phòng không bị thất thoát hơi lạnh và không bị khô da."
      },
      {
        question: "Bao lâu cần thay thế màng lọc của máy cấp khí tươi?",
        answer: "Màng lọc sơ cấp nên được vệ sinh mỗi 3-6 tháng, và màng lọc HEPA chất lượng cao nên được thay thế sau 12-18 tháng tùy thuộc vào mức độ ô nhiễm của môi trường xung quanh."
      }
    ]
  },
  "may-lanh-treo-tuong": {
    content: `
      <p>Máy lạnh treo tường (điều hòa treo tường) là giải pháp làm mát phổ biến nhất hiện nay cho các gia đình, văn phòng nhỏ và căn hộ chung cư. Thiết kế lắp đặt trên cao giúp tối ưu hóa không gian phòng và lưu thông luồng khí lạnh đều khắp phòng.</p>
      <h2>Ưu điểm nổi bật của máy lạnh treo tường chính hãng tại Điện máy ELC</h2>
      <ul>
        <li><strong>Tiết kiệm điện vượt trội:</strong> Các dòng máy lạnh treo tường hiện đại tích hợp công nghệ biến tần Inverter giúp duy trì nhiệt độ ổn định và giảm thiểu hóa đơn tiền điện hàng tháng đến 60%.</li>
        <li><strong>Lọc sạch bụi bẩn, vi khuẩn:</strong> Trang bị hệ thống lọc khí tiên tiến (như màng lọc PM2.5, công nghệ Nanoe-G, lọc bụi mịn) giúp đem lại không khí trong lành, bảo vệ sức khỏe hệ hô hấp của gia đình bạn.</li>
        <li><strong>Vận hành êm ái:</strong> Động cơ máy hoạt động cực kỳ nhẹ nhàng, giảm thiểu tiếng ồn đến mức tối đa, mang lại giấc ngủ ngon và sâu cho cả gia đình.</li>
      </ul>
      <h2>Kinh nghiệm chọn mua công suất máy lạnh treo tường phù hợp</h2>
      <ul>
        <li>Phòng dưới 15m2: Chọn công suất 1HP (9000 BTU).</li>
        <li>Phòng từ 15m2 - 20m2: Chọn công suất 1.5HP (12000 BTU).</li>
        <li>Phòng từ 20m2 - 30m2: Chọn công suất 2HP (18000 BTU).</li>
      </ul>
    `,
    faq: [
      {
        question: "Nên mua máy lạnh treo tường Inverter hay dòng thường?",
        answer: "Nếu bạn sử dụng máy lạnh liên tục trên 6 tiếng mỗi ngày, dòng máy lạnh treo tường Inverter là sự lựa chọn tối ưu giúp tiết kiệm điện hiệu quả và vận hành êm ái hơn."
      },
      {
        question: "Điện máy ELC có hỗ trợ giao lắp máy lạnh tận nơi không?",
        answer: "Điện máy ELC cung cấp dịch vụ giao hàng nhanh chóng và thi công lắp đặt máy lạnh chuyên nghiệp tận nơi tại tất cả các quận huyện thuộc Thành phố Hồ Chí Minh và lân cận."
      }
    ]
  },
  "may-lanh-am-tran-da-huong-thoi": {
    content: `
      <p>Máy lạnh âm trần đa hướng thổi (cassette 4 hướng hoặc thổi tròn 360 độ) là dòng điều hòa được thiết kế âm hoàn toàn vào trần thạch cao, luồng gió lạnh thổi ra từ các hướng giúp phân phối gió mát đồng đều và dịu nhẹ cho toàn bộ không gian phòng.</p>
      <h2>Tại sao nên lựa chọn máy lạnh âm trần đa hướng thổi?</h2>
      <ul>
        <li><strong>Thẩm mỹ sang trọng:</strong> Mặt nạ máy thiết kế tinh tế, phẳng sát trần thạch cao mang lại vẻ đẹp thẩm mỹ cao cấp cho văn phòng, khách sạn, biệt thự.</li>
        <li><strong>Làm lạnh 360 độ:</strong> Thiết kế thổi gió đa hướng giúp khí lạnh được phân bổ đồng đều khắp phòng, không thổi trực tiếp vào người gây khó chịu.</li>
        <li><strong>Tích hợp bơm nước xả:</strong> Hỗ trợ bơm nước ngưng lên cao, giúp giải quyết triệt để vấn đề thoát nước thải điều hòa trong các tòa nhà cao tầng.</li>
      </ul>
    `,
    faq: [
      {
        question: "Độ cao trần tối thiểu để lắp máy lạnh âm trần là bao nhiêu?",
        answer: "Độ cao khoảng trống trần thạch cao tối thiểu cần có là từ 280mm đến 350mm (tùy thuộc vào độ dày của dàn lạnh từng thương hiệu) để lắp đặt vừa vặn máy lạnh âm trần."
      },
      {
        question: "Lắp đặt máy lạnh âm trần có phức tạp không?",
        answer: "Việc thi công máy lạnh âm trần yêu cầu tính kỹ thuật cao, cần phối hợp chặt chẽ với đội thạch cao và đi đường ống đồng, ống nước ngưng trước khi đóng trần."
      }
    ]
  },
  "may-lanh-giau-tran-noi-ong-gio": {
    content: `
      <p>Máy lạnh giấu trần nối ống gió (điều hòa giấu trần) là đỉnh cao của giải pháp thẩm mỹ không khí. Toàn bộ dàn lạnh và hệ thống ống dẫn gió được lắp giấu hoàn toàn trên trần thạch cao, luồng khí mát được dẫn ra ngoài qua các cửa gió nghệ thuật tùy biến.</p>
      <h2>Ưu điểm đẳng cấp của máy lạnh giấu trần nối ống gió</h2>
      <ul>
        <li><strong>Thiết kế sang trọng tuyệt đối:</strong> Phù hợp hoàn hảo cho biệt thự, căn hộ chung cư cao cấp, penthouse, sảnh hội nghị nơi thẩm mỹ kiến trúc là ưu tiên hàng đầu.</li>
        <li><strong>Phân bổ gió linh hoạt:</strong> Có thể kết nối nhiều cửa gió thổi về các vị trí khác nhau trong phòng hoặc phân chia cho các phòng nhỏ lân cận.</li>
        <li><strong>Vận hành cực êm:</strong> Tiếng ồn động cơ được giấu kín phía trong trần nhà và giảm chấn qua ống gió cách âm, mang lại sự yên tĩnh tuyệt đối.</li>
      </ul>
    `,
    faq: [
      {
        question: "Chi phí lắp đặt máy lạnh giấu trần nối ống gió có đắt không?",
        answer: "Chi phí đầu tư ban đầu cao hơn so với máy treo tường hoặc âm trần cassette do phát sinh chi phí thiết kế cửa gió, ống gió mềm, ống tôn và nhân công kỹ thuật chuyên sâu."
      },
      {
        question: "Khi cần bảo trì, sửa chữa máy giấu trần nối ống gió thì làm thế nào?",
        answer: "Trong quá trình làm trần thạch cao, kỹ thuật viên bắt buộc phải thiết kế một cửa thăm trần (kích thước tối thiểu 400x400mm hoặc 600x600mm) ngay vị trí dàn lạnh để phục vụ bảo dưỡng."
      }
    ]
  },
  "may-lanh-tu-dung": {
    content: `
      <p>Máy lạnh tủ đứng (điều hòa cây) là dòng điều hòa đặt sàn có công suất thổi gió cực mạnh. Với thiết kế dạng tủ thời trang, dòng máy này phù hợp cho những không gian rộng lớn, lượng người ra vào thường xuyên như sảnh lớn, phòng khách biệt thự, văn phòng, nhà xưởng.</p>
      <h2>Ưu điểm nổi bật của máy lạnh tủ đứng chính hãng</h2>
      <ul>
        <li><strong>Khả năng làm lạnh siêu tốc:</strong> Quạt thổi công suất lớn, lưu lượng gió thổi mạnh và xa giúp làm mát nhanh chóng không gian rộng lớn ngay khi bật máy.</li>
        <li><strong>Lắp đặt dễ dàng:</strong> Đặt trực tiếp dưới sàn phòng, giúp tiết kiệm thời gian thi công ống đồng và ống xả nước ngưng.</li>
        <li><strong>Thẩm mỹ hiện đại:</strong> Thiết kế dạng tủ đứng thon gọn, trang nhã như một món đồ nội thất cao cấp.</li>
      </ul>
    `,
    faq: [
      {
        question: "Máy lạnh tủ đứng có tiết kiệm điện không?",
        answer: "Các dòng máy lạnh tủ đứng hiện nay tích hợp công nghệ Inverter thế hệ mới giúp kiểm soát điện năng tiêu thụ hiệu quả, tiết kiệm đến 30-50% so với thế hệ cũ."
      },
      {
        question: "Nên lắp máy lạnh tủ đứng trong trường hợp nào?",
        answer: "Nên lắp khi không gian phòng rộng, cần làm mát nhanh và mạnh, cấu trúc trần nhà không thuận tiện để đục đẽo đi ống giấu trần hoặc âm trần."
      }
    ]
  }
};

// 2. Templates for Brands
const BRAND_CONTENT: Record<string, ContentBlock> = {
  "daikin": {
    content: `
      <p>Daikin là thương hiệu điều hòa không khí số 1 thế giới đến từ Nhật Bản. Tại thị trường Việt Nam, điều hòa Daikin luôn đứng đầu về thị phần nhờ vào chất lượng vượt trội, công nghệ tiên tiến và độ bền bỉ đáng kinh ngạc theo thời gian.</p>
      <h2>Những công nghệ cốt lõi làm nên tên tuổi điều hòa Daikin</h2>
      <ul>
        <li><strong>Công nghệ Inverter và máy nén Swing:</strong> Giúp kiểm soát chính xác nhiệt độ phòng, giảm tiêu thụ điện năng tối đa và duy trì độ êm ái tuyệt đối cho dàn nóng lẫn dàn lạnh.</li>
        <li><strong>Luồng gió Coanda độc quyền:</strong> Thổi gió hướng lên trần nhà rồi men theo các bức tường, phân phối luồng khí mát dễ chịu đều khắp phòng mà không thổi trực tiếp vào cơ thể gây lạnh buốt.</li>
        <li><strong>Phin lọc Enzyme Blue kết hợp PM2.5:</strong> Công nghệ phin lọc kép giúp khử mùi hôi, diệt khuẩn, virus và giữ lại các hạt bụi mịn có hại trong không khí.</li>
      </ul>
      <p>Điện máy ELC tự hào là đối tác phân phối chính hãng các sản phẩm Daikin chính ngạch với chính sách bảo hành dài hạn của hãng.</p>
    `,
    faq: [
      {
        question: "Thời gian bảo hành của máy lạnh Daikin chính hãng là bao lâu?",
        answer: "Các sản phẩm máy lạnh Daikin chính hãng thường được bảo hành toàn bộ máy trong 1 năm và riêng bộ phận máy nén (block) được bảo hành đến 5 năm."
      },
      {
        question: "Tại sao nên mua máy lạnh Daikin tại Điện máy ELC?",
        answer: "Điện máy ELC cam kết cung cấp hàng chính hãng 100%, mới nguyên đai nguyên kiện, giá bán cạnh tranh nhất thị trường và đi kèm dịch vụ thi công lắp đặt chuẩn kỹ thuật."
      }
    ]
  },
  "lg": {
    content: `
      <p>LG là tập đoàn công nghệ điện tử hàng đầu Hàn Quốc. Các dòng máy lạnh LG luôn thu hút người tiêu dùng bởi thiết kế hiện đại, nhiều tính năng thông minh và đặc biệt là công nghệ tiết kiệm điện tối ưu Dual Inverter.</p>
      <h2>Ưu điểm nổi bật của dòng máy lạnh LG chính hãng</h2>
      <ul>
        <li><strong>Công nghệ Dual Inverter Compressor:</strong> Máy nén rotor kép giúp làm lạnh nhanh hơn 40%, tiết kiệm điện năng tiêu thụ lên đến 70% và giảm tiếng rung ồn khi vận hành.</li>
        <li><strong>Hệ thống lọc khí lọc bụi mịn PM1.0:</strong> Một số dòng máy cao cấp của LG trang bị bộ cảm biến bụi mịn và máy phát ion giúp lọc sạch không khí như một chiếc máy lọc chuyên nghiệp.</li>
        <li><strong>Tích hợp ứng dụng LG ThinQ:</strong> Cho phép bạn điều khiển tắt/mở, hẹn giờ, điều chỉnh nhiệt độ máy lạnh từ xa bằng điện thoại thông minh qua kết nối Wi-Fi vô cùng tiện lợi.</li>
      </ul>
    `,
    faq: [
      {
        question: "Dòng máy lạnh LG Dual Inverter tiết kiệm điện như thế nào?",
        answer: "Nhờ dải tần số hoạt động rộng của máy nén kép Dual Inverter giúp máy làm lạnh nhanh chóng và duy trì mức công suất cực thấp khi đã đạt nhiệt độ cài đặt, giúp hóa đơn tiền điện giảm đáng kể."
      },
      {
        question: "Ứng dụng LG ThinQ có dễ sử dụng không?",
        answer: "Rất dễ sử dụng. Bạn chỉ cần tải app LG ThinQ trên AppStore hoặc CHPlay, đăng ký tài khoản và kết nối máy lạnh với Wi-Fi trong nhà để bắt đầu điều khiển từ xa."
      }
    ]
  },
  "panasonic": {
    content: `
      <p>Panasonic là thương hiệu điện tử gia dụng hàng đầu của Nhật Bản với thâm niên lâu năm. Máy lạnh Panasonic luôn được đánh giá cao bởi thiết kế trang nhã, công nghệ làm lạnh thông minh và khả năng lọc sạch không khí độc quyền Nanoe-X.</p>
      <h2>Các tính năng vượt trội trên máy lạnh Panasonic</h2>
      <ul>
        <li><strong>Công nghệ lọc khí Nanoe-X bảo vệ sức khỏe:</strong> Giải phóng hàng tỷ gốc gốc OH- giúp ức chế hiệu quả vi khuẩn, virus (bao gồm SARS-CoV-2), khử sạch mùi ẩm mốc khó chịu và cấp ẩm cho da.</li>
        <li><strong>Làm lạnh nhanh iAUTO-X:</strong> Kết hợp giữa công nghệ P-TECh và cánh đảo gió Aerowings giúp đưa phòng đạt nhiệt độ mát lạnh sảng khoái ngay tức thì.</li>
        <li><strong>Cảm biến độ ẩm thông minh (Humidity Sensor):</strong> Tự động theo dõi và điều chỉnh độ ẩm trong phòng luôn dưới 60%, bảo vệ da không bị khô ráp khi nằm phòng lạnh.</li>
      </ul>
    `,
    faq: [
      {
        question: "Công nghệ lọc khí Nanoe-X hoạt động độc lập với chế độ lạnh được không?",
        answer: "Có. Bạn có thể bật riêng tính năng Nanoe-X lọc không khí trên máy lạnh Panasonic mà không cần bật chế độ làm lạnh, điện năng tiêu thụ lúc này cực kỳ nhỏ (chỉ tương đương bóng đèn 25W)."
      },
      {
        question: "Máy lạnh Panasonic bảo hành mấy năm?",
        answer: "Sản phẩm được bảo hành chính hãng toàn bộ máy trong 1 năm và máy nén khí (block) được bảo hành đến 7 năm."
      }
    ]
  },
  "samsung": {
    content: `
      <p>Samsung nổi tiếng với những cải tiến công nghệ đột phá. Trong mảng điều hòa không khí, dòng sản phẩm Samsung WindFree là cuộc cách mạng lớn mang đến giải pháp làm lạnh không gió buốt, bảo vệ sức khỏe nhạy cảm của gia đình bạn.</p>
      <h2>Tính năng đột phá của điều hòa Samsung chính hãng</h2>
      <ul>
        <li><strong>Công nghệ làm lạnh không gió buốt WindFree:</strong> Luồng khí lạnh được phân bổ dịu nhẹ qua 23.000 lỗ siêu nhỏ trên mặt nạ máy, giúp làm mát phòng mà không thổi gió buốt trực tiếp vào người.</li>
        <li><strong>Động cơ Digital Inverter Boost:</strong> Tiết kiệm điện năng vượt trội lên đến 73% và vận hành cực kỳ ổn định, bền bỉ.</li>
        <li><strong>Bộ lọc PM1.0 kháng khuẩn:</strong> Lọc sạch bụi siêu mịn và vô hiệu hóa các loại vi khuẩn bám trên màng lọc hiệu quả.</li>
      </ul>
    `,
    faq: [
      {
        question: "Làm lạnh WindFree của Samsung có mát không?",
        answer: "Rất mát và dễ chịu. Ban đầu máy sẽ chạy ở chế độ làm lạnh nhanh bình thường để hạ nhiệt độ phòng, sau khi đạt nhiệt độ cài đặt, máy sẽ tự động chuyển sang chế độ WindFree để duy trì khí mát nhẹ nhàng."
      },
      {
        question: "Chế độ WindFree có tiết kiệm điện hơn không?",
        answer: "Có. Khi hoạt động ở chế độ WindFree, máy nén dàn nóng tiêu thụ điện năng cực thấp, giúp tiết kiệm thêm đến 77% điện năng so với chế độ làm lạnh thông thường."
      }
    ]
  }
};

// 3. Templates for Groups
const GROUP_CONTENT: Record<string, ContentBlock> = {
  "may-lanh": {
    content: `
      <p>Chào mừng bạn đến với Điện máy ELC - Tổng kho phân phối máy lạnh (điều hòa không khí) chính hãng hàng đầu tại Thành phố Hồ Chí Minh. Chúng tôi tự hào mang đến cho khách hàng các giải pháp không khí chuyên nghiệp từ máy lạnh dân dụng cho gia đình đến hệ thống máy lạnh thương mại cho các công trình lớn.</p>
      <h2>Các dòng sản phẩm máy lạnh đa dạng tại Điện máy ELC</h2>
      <ul>
        <li><strong>Máy lạnh treo tường dân dụng:</strong> Giải pháp tiện lợi, tiết kiệm cho phòng ngủ, phòng khách gia đình từ 1HP đến 2.5HP.</li>
        <li><strong>Máy lạnh âm trần (Cassette):</strong> Sang trọng, làm lạnh đa hướng thổi cho văn phòng, quán cà phê, nhà hàng.</li>
        <li><strong>Máy lạnh giấu trần nối ống gió:</strong> Thẩm mỹ đẳng cấp, luồng gió dịu nhẹ ẩn giấu tinh tế trên trần thạch cao.</li>
        <li><strong>Máy lạnh tủ đứng đặt sàn:</strong> Công suất làm lạnh cực mạnh, thổi gió xa chuyên dùng cho sảnh đón khách, nhà xưởng lớn.</li>
      </ul>
      <h2>Cam kết chất lượng dịch vụ từ Điện máy ELC</h2>
      <ul>
        <li>Hàng chính hãng 100%, mới nguyên kiện từ Daikin, Panasonic, LG, Samsung, Gree, Toshiba.</li>
        <li>Giá bán lẻ tốt nhất thị trường kèm nhiều chương trình khuyến mãi hấp dẫn.</li>
        <li>Đội ngũ kỹ sư, thợ kỹ thuật lắp đặt tay nghề cao, lắp đặt nhanh chóng, thẩm mỹ và đúng tiêu chuẩn kỹ thuật của hãng.</li>
        <li>Hỗ trợ tư vấn thiết kế hệ thống điều hòa không khí miễn phí cho biệt thự, tòa nhà.</li>
      </ul>
    `,
    faq: [
      {
        question: "Nên mua máy lạnh của hãng nào tốt nhất hiện nay?",
        answer: "Nếu bạn ưu tiên độ bền bỉ và làm mát dịu nhẹ, Daikin và Panasonic là lựa chọn hàng đầu. Nếu bạn thích công nghệ thông minh và giá hợp lý hơn, LG và Samsung rất đáng cân nhắc. Ngoài ra, Gree và Midea là giải pháp tiết kiệm chi phí cực tốt."
      },
      {
        question: "Điện máy ELC có khảo sát lắp đặt tận nhà không?",
        answer: "Có. Điện máy ELC hỗ trợ kỹ thuật viên khảo sát hiện trạng công trình hoàn toàn miễn phí tại khu vực TP.HCM để đưa ra phương án lắp đặt đường ống và công suất máy phù hợp nhất."
      }
    ]
  },
  "nha-thong-minh": {
    content: `
      <p>Nhà thông minh (Smart Home) là xu hướng sống hiện đại của kỷ nguyên công nghệ 4.0. Điện máy ELC cung cấp trọn gói các giải pháp thiết bị thông minh giúp bạn dễ dàng giám sát, điều khiển toàn bộ hệ thống chiếu sáng, điều hòa, an ninh trong nhà bằng giọng nói hoặc qua điện thoại từ bất cứ đâu.</p>
      <h2>Các giải pháp nhà thông minh nổi bật tại Điện máy ELC</h2>
      <ul>
        <li><strong>Hệ thống chiếu sáng thông minh:</strong> Tự động tắt/mở theo lịch trình, cảm biến chuyển động hoặc tùy chỉnh độ sáng, màu sắc theo ngữ cảnh.</li>
        <li><strong>Điều khiển điều hòa thông minh:</strong> Tự động tăng giảm nhiệt độ dễ chịu vào ban đêm hoặc bật sẵn máy lạnh trước khi bạn đi làm về.</li>
        <li><strong>Hệ thống an ninh cảnh báo sớm:</strong> Tích hợp camera AI phát hiện xâm nhập, cảm biến rò rỉ khí gas, cảm biến khói và tự động gửi thông báo khẩn cấp đến điện thoại.</li>
      </ul>
    `,
    faq: [
      {
        question: "Lắp đặt hệ thống nhà thông minh có cần đục khoét tường không?",
        answer: "Không cần. Các giải pháp nhà thông minh hiện đại tại Điện máy ELC sử dụng kết nối không dây (Zigbee, Wi-Fi), thiết bị công tắc thông minh lắp vừa vặn vào đế âm tường truyền thống có sẵn trong nhà bạn."
      },
      {
        question: "Hệ thống nhà thông minh có hoạt động được khi mất Internet không?",
        answer: "Có. Các kịch bản tự động hóa nội bộ (như bấm công tắc tắt toàn bộ đèn, cảm biến chuyển động bật đèn hành lang) vẫn hoạt động bình thường qua bộ điều khiển trung tâm cục bộ ngay cả khi mất kết nối Internet ra bên ngoài."
      }
    ]
  }
};

// Generic Fallback builder
function getGenericBlock(name: string, type: string): ContentBlock {
  return {
    content: `
      <p>Chào mừng bạn đến với Điện máy ELC - Địa chỉ tin cậy chuyên cung cấp các sản phẩm và dịch vụ ${name} chất lượng cao hàng đầu tại Thành phố Hồ Chí Minh. Chúng tôi cam kết mang đến những sản phẩm tốt nhất, bảo hành chính hãng và dịch vụ chuyên nghiệp vượt trội.</p>
      <h2>Tại sao nên lựa chọn giải pháp ${name} tại Điện máy ELC?</h2>
      <ul>
        <li><strong>Chất lượng được kiểm định:</strong> 100% sản phẩm chính hãng, đầy đủ giấy tờ xuất xứ rõ ràng.</li>
        <li><strong>Tư vấn tận tâm:</strong> Đội ngũ kỹ thuật viên am hiểu sâu sắc về sản phẩm, hỗ trợ lựa chọn giải pháp tiết kiệm và hiệu quả nhất.</li>
        <li><strong>Chính sách hậu mãi uy tín:</strong> Hỗ trợ kỹ thuật nhanh chóng, bảo trì định kỳ dài hạn giúp thiết bị luôn hoạt động tối ưu.</li>
      </ul>
    `,
    faq: [
      {
        question: `Điện máy ELC cung cấp giải pháp ${name} tại những khu vực nào?`,
        answer: `Chúng tôi hỗ trợ tư vấn, giao hàng và thi công lắp đặt các sản phẩm dịch vụ liên quan đến ${name} tại toàn bộ các quận huyện thuộc Thành phố Hồ Chí Minh, Bình Dương, Đồng Nai và các khu vực lân cận.`
      },
      {
        question: `Làm thế nào để nhận báo giá chi tiết cho ${name}?`,
        answer: `Quý khách hàng có thể liên hệ trực tiếp qua số hotline hoặc để lại thông tin liên hệ trên website. Đội ngũ tư vấn của Điện máy ELC sẽ liên hệ lại trong thời gian sớm nhất.`
      }
    ]
  };
}

async function enrich() {
  console.log("Loading database entities to enrich...");

  const [categoriesRes, brandsRes, groupsRes] = await Promise.all([
    supabase.from("categories").select("id, name, slug").is("deleted_at", null),
    supabase.from("brands").select("id, name, slug").is("deleted_at", null),
    supabase.from("group_categories").select("id, name, slug").is("deleted_at", null)
  ]);

  const categories = categoriesRes.data || [];
  const brands = brandsRes.data || [];
  const groups = groupsRes.data || [];

  console.log(`Retrieved ${categories.length} categories, ${brands.length} brands, and ${groups.length} groups.`);

  // 1. Update Categories
  console.log("\nEnriching Categories...");
  for (const cat of categories) {
    const data = CATEGORY_CONTENT[cat.slug] || getGenericBlock(cat.name, "danh mục");
    const { error } = await supabase
      .from("categories")
      .update({
        content: data.content.trim(),
        faq: data.faq
      })
      .eq("id", cat.id);

    if (error) {
      console.error(`Error updating category ${cat.name}:`, error.message);
    } else {
      console.log(`Updated category: ${cat.name} (${cat.slug})`);
    }
  }

  // 2. Update Brands
  console.log("\nEnriching Brands...");
  for (const brand of brands) {
    const data = BRAND_CONTENT[brand.slug] || getGenericBlock(brand.name, "thương hiệu");
    const { error } = await supabase
      .from("brands")
      .update({
        content: data.content.trim(),
        faq: data.faq
      })
      .eq("id", brand.id);

    if (error) {
      console.error(`Error updating brand ${brand.name}:`, error.message);
    } else {
      console.log(`Updated brand: ${brand.name} (${brand.slug})`);
    }
  }

  // 3. Update Groups
  console.log("\nEnriching Groups...");
  for (const group of groups) {
    const data = GROUP_CONTENT[group.slug] || getGenericBlock(group.name, "nhóm sản phẩm");
    const { error } = await supabase
      .from("group_categories")
      .update({
        content: data.content.trim(),
        faq: data.faq
      })
      .eq("id", group.id);

    if (error) {
      console.error(`Error updating group ${group.name}:`, error.message);
    } else {
      console.log(`Updated group: ${group.name} (${group.slug})`);
    }
  }

  console.log("\nEnrichment completed successfully!");
}

enrich().catch(console.error);
